-- Auto-turn on admission: a voted-in member gets their collection slot
-- immediately, with no organizer sync step.
--
-- Until now admission and scheduling were two separate steps: tally_join_votes
-- inserted the member at payout_position = max + 1, and the organizer had to
-- run generate-schedule again to append that member's cycle at the end of the
-- rotation. If they never did, the new member paid into every turn but had no
-- turn of their own — and the circle page showed a "sync" card begging the
-- organizer to fix it.
--
-- This adds the second half of admission, following the same security-definer
-- trigger convention (never the client — RLS blocks cycle/payout writes):
--
--   append_turn_on_admission — after a group_members insert, and only when
--   the rotation has already started (cycles exist) in an active/paused
--   circle, append one upcoming cycle for the new member at max + 1, due one
--   step after the last turn (weekly +7 days, monthly +1 month — the same
--   stepping generate-schedule uses), plus its pending payout at the pooled
--   pot (contribution_amount x active members, same snapshot rule).
--
--   Skips (each is a real path, not paranoia):
--   - non-active rows (pending/removed never collect);
--   - forming circles with no cycles yet — the first generator run already
--     includes every member, so there is nothing to append;
--   - completed circles — unreachable (tally admits nobody there) but guarded;
--   - a member who already has a turn (sync ran first, or re-fire).
--
--   Resilience over strictness: the group row is locked so two approvals
--   landing together cannot take the same cycle_number, and a
--   unique_violation on the append (a concurrent sync won the race) admits
--   the member anyway and leaves the turn to the sync repair path — an
--   admission must never fail because of scheduling. generate-schedule is
--   unchanged and stays as that repair path: it skips already-scheduled
--   members and backfills payouts for bare cycles.
--
--   Billing symmetry is preserved, not changed: the new member owes only
--   turns due on/after their join day (the enrolledIn rule in the app and
--   process-payout), and their appended turn sits at the end, so nothing
--   retroactive is ever created for anyone.

create or replace function public.append_turn_on_admission()
returns trigger as $$
declare
  v_amount numeric(12,2);
  v_freq text;
  v_gstatus text;
  v_count int;
  v_next int;
  v_last_due date;
  v_due date;
  v_cycle_id uuid;
begin
  if new.status is distinct from 'active' then
    return new;
  end if;

  -- Serialize concurrent admissions: cycle_number must stay gapless per group.
  select status into v_gstatus
  from public.groups
  where id = new.group_id
  for update;

  if v_gstatus is distinct from 'active' and v_gstatus is distinct from 'paused' then
    return new;
  end if;

  if not exists (select 1 from public.cycles where group_id = new.group_id) then
    return new;
  end if;

  if exists (
    select 1 from public.cycles
    where group_id = new.group_id and recipient_member_id = new.id
  ) then
    return new;
  end if;

  select contribution_amount, frequency into v_amount, v_freq
  from public.groups
  where id = new.group_id;

  select cycle_number, due_date into v_next, v_last_due
  from public.cycles
  where group_id = new.group_id
  order by cycle_number desc
  limit 1;
  v_next := v_next + 1;
  if v_freq = 'monthly' then
    v_due := (v_last_due + interval '1 month')::date;
  else
    v_due := (v_last_due + interval '7 days')::date;
  end if;

  select count(*) into v_count
  from public.group_members
  where group_id = new.group_id and status = 'active';

  begin
    insert into public.cycles (group_id, cycle_number, recipient_member_id, due_date, status)
    values (new.group_id, v_next, new.id, v_due, 'upcoming')
    returning id into v_cycle_id;

    insert into public.payouts (cycle_id, recipient_member_id, amount, status)
    values (v_cycle_id, new.id, v_amount * v_count, 'pending');
  exception when unique_violation then
    -- A concurrent sync won the race: the member is still admitted, and the
    -- sync repair path (skips scheduled members, backfills bare cycles)
    -- owns the missing turn.
    return new;
  end;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_member_admitted on public.group_members;
create trigger on_member_admitted
  after insert on public.group_members
  for each row execute function public.append_turn_on_admission();
