-- Applicant names for voting members.
--
-- Applying to a circle is asking its members to judge you, so pending
-- applicants are visible to those members by design: name, verified phone,
-- and who invited them. The base profiles policy ("own or shared-group")
-- correctly hides non-members everywhere else, so names arrive through this
-- security-definer RPC instead of a widened policy (which would become a
-- directory oracle). Non-members get zero rows — fail closed, no exception.
-- Applicant-side blindness is untouched: the join page still shows status
-- only, never tallies or other applicants.

create or replace function public.pending_applicants(p_group_id uuid)
returns table (
  request_id uuid,
  applicant_name text,
  applicant_phone text,
  inviter_name text,
  created_at timestamptz
)
as $$
begin
  if not public.is_active_member(p_group_id, auth.uid()) then
    return;
  end if;

  return query
  select jr.id,
    p.full_name,
    case when p.phone_verified then p.phone else null end,
    ip.full_name,
    jr.created_at
  from public.join_requests jr
  join public.profiles p on p.id = jr.applicant_id
  left join public.profiles ip on ip.id = jr.invited_by
  where jr.group_id = p_group_id
    and jr.status = 'pending'
  order by jr.created_at asc;
end;
$$ language plpgsql security definer stable;
