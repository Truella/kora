-- Let applicants see their own join request status (Day 5B).
--
-- The join page is applicant-blind by design (no vote counts ever reach
-- outsiders), but without any select policy an applicant can't even learn
-- whether their request is still pending or was declined — the page can
-- only show the neutral duplicate-request copy. This additive policy lets
-- the join page read the caller's own rows (status only) so it can render
-- honest terminal copy: "still voting" vs "not admitted".
-- Members' views are unchanged; no update path is added (status flips
-- stay in tally_join_votes), and re-application stays blocked by the
-- (group_id, applicant_id) unique constraint — deliberate for MVP.
drop policy if exists "applicants view own requests" on public.join_requests;

create policy "applicants view own requests"
on public.join_requests for select
using (applicant_id = auth.uid());
