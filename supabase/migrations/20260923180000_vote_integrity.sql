-- Vote integrity (bad-fix batch, Phase 1).
--
-- Fix 1 — same-circle voters. The old "cast vote as active member"
-- policy only checked voter_id belongs to ONE of the caller's
-- memberships, never that it belongs to THIS request's circle: a
-- member of circle A could vote on circle B's applicants. The check
-- now joins through the request's own group. Implemented as a
-- security-definer helper so the check itself never trips over RLS.
--
-- Fix 2 — terminal guard in tally_join_votes. The trigger fired on
-- every insert with no status check: a vote after approval crashed on
-- the (group_id, user_id) unique insert, and votes after rejection
-- could flip the request to approved plus insert a member. Now only
-- pending requests transition; late votes are recorded but inert, and
-- the member insert is conflict-safe (concurrent approving votes).

create or replace function public.can_cast_vote(
  p_request_id uuid,
  p_voter_id uuid
)
returns boolean as $$
  select exists (
    select 1
    from public.group_members gm
    join public.join_requests jr on jr.group_id = gm.group_id
    where jr.id = p_request_id
      and gm.id = p_voter_id
      and gm.user_id = auth.uid()
      and gm.status = 'active'
  );
$$ language sql security definer stable;

drop policy if exists "cast vote as active member" on public.join_votes;

create policy "cast vote as active member"
on public.join_votes for insert
with check (public.can_cast_vote(join_request_id, voter_id));

create or replace function public.tally_join_votes()
returns trigger as $$
declare
  v_group_id uuid;
  v_applicant_id uuid;
  v_invited_by uuid;
  v_threshold numeric(3,2);
  v_status text;
  v_active_members int;
  v_approve_votes int;
  v_reject_votes int;
  v_next_position int;
begin
  select jr.group_id, jr.applicant_id, jr.invited_by, g.vote_threshold, jr.status
    into v_group_id, v_applicant_id, v_invited_by, v_threshold, v_status
  from public.join_requests jr
  join public.groups g on g.id = jr.group_id
  where jr.id = new.join_request_id;

  -- Terminal guard: decided requests never transition again.
  if v_status is distinct from 'pending' then
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
