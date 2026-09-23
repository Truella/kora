-- Invite attribution + rejected re-apply (bad-fix batch, Phase 2).
--
-- invited_by columns existed but the join button never wrote them, so
-- every member rendered "Joined via link". Invite links now carry
-- ?by=<inviter member id>; the app passes it through on the request
-- insert. Validation lives HERE, not app-side: applicants are not
-- group members, so no client query could check membership through
-- RLS. is_valid_inviter runs security-definer — a faked or foreign
-- id fails the insert check and the app retries bare (NULL inviter).
--
-- Re-apply: rejected applicants may delete their OWN rejected rows
-- (and only rejected — the status guard is what stops the
-- vote-reset exploit of deleting a pending request to wipe its
-- tally). The delete cascades to that round's votes, so a second
-- application starts a fresh tally. Approved/pending rows are
-- untouched: members use the member shortcut, pendings keep voting.

create or replace function public.is_valid_inviter(
  p_group_id uuid,
  p_inviter_id uuid
)
returns boolean as $$
  select exists (
    select 1
    from public.group_members
    where id = p_inviter_id
      and group_id = p_group_id
      and status = 'active'
  );
$$ language sql security definer stable;

drop policy if exists "apply to join" on public.join_requests;

create policy "apply to join"
on public.join_requests for insert
with check (
  applicant_id = auth.uid()
  and (
    invited_by is null
    or public.is_valid_inviter(group_id, invited_by)
  )
);

drop policy if exists "applicants delete own rejected requests" on public.join_requests;

create policy "applicants delete own rejected requests"
on public.join_requests for delete
using (
  applicant_id = auth.uid()
  and status = 'rejected'
);
