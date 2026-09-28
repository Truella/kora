-- Applicant avatars for the voting card.
--
-- pending_applicants (20260924130000_applicant_visibility.sql) returned
-- name + verified phone + inviter, so the vote card had no photo slot —
-- every applicant rendered as text-only while the members list right below
-- it shows avatars. Additive: one more column (p.avatar_url, null when the
-- applicant has none — the card falls back to an initials wash). No policy
-- change: same security-definer, same active-members-only gate.

-- Postgres forbids CREATE OR REPLACE when the return type changes
-- (42P13), so drop first. No DB dependents — the only caller is the app
-- via RPC.

drop function if exists public.pending_applicants(uuid);

create function public.pending_applicants(p_group_id uuid)
returns table (
  request_id uuid,
  applicant_name text,
  applicant_phone text,
  inviter_name text,
  applicant_avatar text,
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
    p.avatar_url,
    jr.created_at
  from public.join_requests jr
  join public.profiles p on p.id = jr.applicant_id
  left join public.profiles ip on ip.id = jr.invited_by
  where jr.group_id = p_group_id
    and jr.status = 'pending'
  order by jr.created_at asc;
end;
$$ language plpgsql security definer stable;
