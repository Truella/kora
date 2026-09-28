-- Pot top-up on admission + repair of stale pending pots.
--
-- Root cause: payouts.amount was snapshotted at schedule time (2 members x
-- share = 20k) and never revisited. A member admitted before Turn 1's due
-- date owes Turn 1 (enrolledIn rule), pays their share, but the pending
-- payout still says 20k — so 30k is collected and the receiver is shown 20k.
-- Upcoming rows derived "N people will pay" from that same stale amount, so
-- Turn 2 also lied ("2 people will pay" with 3 enrolled).
--
-- Fix, in trigger order:
-- 1. Widen the money guards so schedule corrections are legal: pending->pending
--    payout amount top-ups (admission growth), and pending->pending
--    contribution payment_reference rewrites (create-charge retry). Settled-row
--    edits and all deletes still raise — the tamper-evidence stays.
-- 2. append_turn_on_admission tops up every other pending payout the newcomer
--    owes (due_date >= joined UTC date) to share x active count. For those
--    cycles every other active member joined earlier, so active count ==
--    enrolled count. Cycles the newcomer does not owe are untouched.
-- 3. One-off repair: every pending payout becomes share x enrolled count
--    (active members with joined UTC date <= cycle due_date).

create or replace function public.guard_contribution_transition()
returns trigger as $$
begin
  if TG_OP = 'DELETE' then
    raise exception 'Contributions cannot be deleted (append-only ledger)';
  end if;

  if old.status = 'pending'
     and (new.status = 'paid' or new.status = 'late') then
    return new;
  end if;

  -- create-charge rewrites payment_reference on a pending retry (same cycle,
  -- same member, same amount, still pending). That is scheduling, not money
  -- movement, so it stays legal. Anything else on a pending row still raises.
  if old.status = 'pending' and new.status = 'pending'
     and old.cycle_id is not distinct from new.cycle_id
     and old.member_id is not distinct from new.member_id
     and old.amount is not distinct from new.amount then
    return new;
  end if;

  raise exception
    'Contributions are append-only: only pending → paid | late allowed';
end;
$$ language plpgsql;

create or replace function public.guard_payout_transition()
returns trigger as $$
begin
  if TG_OP = 'DELETE' then
    raise exception 'Payouts cannot be deleted (append-only ledger)';
  end if;

  if old.status = 'pending'
     and (new.status = 'completed' or new.status = 'failed') then
    return new;
  end if;

  -- Admission growth: a late joiner enrolled in a future turn grows its pot
  -- (share x roster). Same cycle, same recipient, still pending — only the
  -- amount moves. Settled rows remain untouchable.
  if old.status = 'pending' and new.status = 'pending'
     and old.cycle_id is not distinct from new.cycle_id
     and old.recipient_member_id is not distinct from new.recipient_member_id then
    return new;
  end if;

  raise exception
    'Payouts are append-only: only pending → completed | failed allowed';
end;
$$ language plpgsql;

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
  v_joined date;
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

  -- Top up every other pending turn this newcomer owes: their share is now
  -- part of the collected pot, so the receiver's figure grows with them.
  -- Filtered to due_date >= joined day (the enrolledIn boundary) — turns that
  -- ran before they arrived keep their old pot. For those turns every other
  -- active member joined earlier, so share x active count == share x enrolled.
  v_joined := (new.joined_at at time zone 'UTC')::date;
  update public.payouts p
  set amount = v_amount * v_count
  from public.cycles c
  where p.cycle_id = c.id
    and c.group_id = new.group_id
    and c.id is distinct from v_cycle_id
    and c.status is distinct from 'completed'
    and p.status = 'pending'
    and c.due_date >= v_joined
    and p.amount is distinct from v_amount * v_count;

  return new;
end;
$$ language plpgsql security definer;

-- Repair: pending pots become share x enrolled (members present on due day).
-- Covers circles admitted before the top-up above existed.
update public.payouts p
set amount = g.contribution_amount * e.enrolled
from public.cycles c
join public.groups g on g.id = c.group_id
join lateral (
  select count(*)::int as enrolled
  from public.group_members gm
  where gm.group_id = c.group_id
    and gm.status = 'active'
    and (gm.joined_at at time zone 'UTC')::date <= c.due_date
) e on true
where p.cycle_id = c.id
  and p.status = 'pending'
  and c.status is distinct from 'completed'
  and e.enrolled > 0
  and p.amount is distinct from g.contribution_amount * e.enrolled;
