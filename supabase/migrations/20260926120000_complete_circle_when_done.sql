-- Circle close-out: the rotation ending must be visible to every member.
--
-- Until now nothing ever wrote groups.status = 'completed': process-payout
-- flips the last cycle to completed and stops, so a finished circle kept
-- reading as an active one with nothing due (home fell through to a bare
-- contribution amount under "Your payout", the directory to
-- "No contributions due yet"). The completed badge, "Rotation complete"
-- panels and NextUp branch all existed but were unreachable.
--
-- This adds the writer, following the handle_new_group / tally_join_votes
-- convention (security-definer trigger, never the client):
--
--   complete_circle_when_done — after a cycle flips to completed, and no
--   open cycle remains in the group, the group closes too. UPDATE-only on
--   purpose: generate-schedule inserts cycles as upcoming and completion
--   always arrives as an update (process-payout), while multi-row seed
--   inserts mix completed and upcoming rows — an INSERT trigger would see
--   the statement half-applied and close the circle early.
--
--   Only active/paused circles transition (lock_group_governance already
--   allows exactly active → completed and paused → completed, and rejects
--   everything else, so the update cannot fail the gate). The group row is
--   locked so two turns settling concurrently cannot both pass the check.
--
--   No Edge Function change: process-payout already flips the cycle in the
--   same transaction, so the status lands atomically with the last payout
--   and every member's next read — home snapshot, directory, detail page,
--   ledger — sees the finished circle. The cycles UPDATE already drives the
--   realtime refetch, so no publication change is needed either.
--
-- Also freezes the membership door while closed: tally_join_votes admits
-- nobody into a completed circle (votes are recorded but inert, same as
-- post-decision votes). Restart-with-vote-in/out is the planned follow-up;
-- until then a finished circle must not silently gain members.

create or replace function public.complete_circle_when_done()
returns trigger as $$
declare
  v_group_id uuid;
  v_status text;
  v_open int;
begin
  -- Only a transition into completed can finish a rotation.
  if new.status is distinct from 'completed' then
    return new;
  end if;
  if old.status is not distinct from new.status then
    return new;
  end if;

  v_group_id := new.group_id;

  -- Serialize concurrent settlements of the last two turns.
  select status into v_status
  from public.groups
  where id = v_group_id
  for update;

  if v_status not in ('active', 'paused') then
    return new;
  end if;

  select count(*) into v_open
  from public.cycles
  where group_id = v_group_id
    and status is distinct from 'completed';

  if v_open = 0 then
    update public.groups
    set status = 'completed'
    where id = v_group_id;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_cycle_completed on public.cycles;
create trigger on_cycle_completed
  after update of status on public.cycles
  for each row execute function public.complete_circle_when_done();

-- A finished circle admits nobody until the restart feature owns that flow.
-- Votes are still recorded (applicant-blindness and tallies stay intact)
-- but cannot flip a request or insert a member.
create or replace function public.tally_join_votes()
returns trigger as $$
declare
  v_group_id uuid;
  v_applicant_id uuid;
  v_invited_by uuid;
  v_threshold numeric(3,2);
  v_status text;
  v_group_status text;
  v_active_members int;
  v_approve_votes int;
  v_reject_votes int;
  v_next_position int;
begin
  select jr.group_id, jr.applicant_id, jr.invited_by, g.vote_threshold, jr.status, g.status
    into v_group_id, v_applicant_id, v_invited_by, v_threshold, v_status, v_group_status
  from public.join_requests jr
  join public.groups g on g.id = jr.group_id
  where jr.id = new.join_request_id;

  -- Terminal guard: decided requests never transition again.
  if v_status is distinct from 'pending' then
    return new;
  end if;

  -- Closed circle: the vote is recorded but cannot admit anyone.
  if v_group_status is not distinct from 'completed' then
    return new;
  end if;

  select count(*) into v_active_members
  from public.group_members
  where group_id = v_group_id and status = 'active';

  select count(*) filter (where vote = 'approve'),
         count(*) filter (where vote = 'reject')
    into v_approve_votes, v_reject_votes
  from public.join_votes
  where join_request_id = new.join_request_id;

  if v_approve_votes::numeric / nullif(v_active_members, 0) >= v_threshold then
    update public.join_requests set status = 'approved' where id = new.join_request_id;

    select coalesce(max(payout_position), 0) + 1 into v_next_position
    from public.group_members where group_id = v_group_id;

    -- Conflict-safe: concurrent approving votes must not abort each
    -- other on the (group_id, user_id) unique constraint.
    insert into public.group_members (group_id, user_id, invited_by, status, payout_position)
    values (v_group_id, v_applicant_id, v_invited_by, 'active', v_next_position)
    on conflict (group_id, user_id) do nothing;

  elsif v_reject_votes::numeric / nullif(v_active_members, 0) > (1 - v_threshold) then
    update public.join_requests set status = 'rejected' where id = new.join_request_id;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_join_vote_cast on public.join_votes;
create trigger on_join_vote_cast
  after insert on public.join_votes
  for each row execute function public.tally_join_votes();
