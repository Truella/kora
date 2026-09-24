-- Directed phone invites (coexists with anonymous link invites) + invite
-- attribution fix.
--
-- BUG FIX: ?by= carried group_members.id, but join_requests.invited_by FKs to
-- profiles(id) — so every attributed link invite died with 23503 and the
-- button showed "invalid link" (prod has 1 request, 0 attributed). ?by= now
-- carries the inviter's PROFILE id: is_valid_inviter checks active membership
-- by user instead of by member row. Readers already resolve invited_by through
-- profiles and seed already stores profile ids, so no data fix is needed — an
-- FK-violating row could never have been written.
--
-- NEW: public.circle_invites — addressed invites by verified phone. Link
-- invites stay anonymous (only path before an identity exists); phone invites
-- let an existing user see a nudge on /home. Both funnels converge on
-- join_requests + tally_join_votes: votes are never skipped, membership still
-- flips only via the trigger. Money tables untouched.
--
-- No public directory: the invitee matches on their OWN verified phone
-- (profiles.phone where id = auth.uid()), so no client query can enumerate
-- other users. Group/inviter names reach the invitee through the
-- security-definer my_pending_invites() RPC, since group RLS correctly hides
-- circles they are not members of yet.

create or replace function public.is_valid_inviter(
  p_group_id uuid,
  p_inviter_id uuid
)
returns boolean as $$
  select exists (
    select 1
    from public.group_members
    where group_id = p_group_id
      and user_id = p_inviter_id
      and status = 'active'
  );
$$ language sql security definer stable;

create table public.circle_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  inviter_user_id uuid not null references public.profiles(id),
  invitee_phone text not null check (invitee_phone ~ '^\+[1-9][0-9]{6,14}$'),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now()
);

-- One live nudge per number per circle. A declined invite frees the pair so
-- the inviter can ask again; a re-invite is a new row, never a status flip.
create unique index uniq_pending_invite
  on public.circle_invites (group_id, invitee_phone)
  where status = 'pending';
create index idx_invites_phone
  on public.circle_invites (invitee_phone, status);

alter table public.circle_invites enable row level security;

-- Send: active members invite by phone for their own circle. Attribution is
-- the caller's own profile id — another member's id fails the ownership half.
drop policy if exists "members invite by phone" on public.circle_invites;
create policy "members invite by phone"
on public.circle_invites for insert
with check (
  inviter_user_id = auth.uid()
  and public.is_active_member(group_id, auth.uid())
);

-- Read: the sender sees what they sent; the invitee matches on their own
-- verified phone (unverified numbers match nothing — no squatting).
drop policy if exists "invite participants view" on public.circle_invites;
create policy "invite participants view"
on public.circle_invites for select
using (
  inviter_user_id = auth.uid()
  or invitee_phone = (
    select phone from public.profiles
    where id = auth.uid() and phone_verified = true
  )
);

-- No client update policy: accept/decline run through the RPCs below, which
-- write the join_request atomically with the status flip. Direct writes fail
-- closed.
--
-- Cancel: the sender can retract a still-pending nudge.
drop policy if exists "inviter cancels pending invite" on public.circle_invites;
create policy "inviter cancels pending invite"
on public.circle_invites for delete
using (
  inviter_user_id = auth.uid()
  and status = 'pending'
);

-- Refuse to invite a number that already belongs to an active member of the
-- same circle (security definer: the caller cannot read other profiles
-- through RLS, but this check must). Surfaces as `already_member` (P0001);
-- telling a member "already in this circle" leaks nothing beyond their own
-- circle's roster, which they can already see.
create or replace function public.reject_invite_for_member()
returns trigger as $$
begin
  if exists (
    select 1
    from public.group_members gm
    join public.profiles p on p.id = gm.user_id
    where gm.group_id = NEW.group_id
      and gm.status = 'active'
      and p.phone = NEW.invitee_phone
  ) then
    raise exception 'already_member' using errcode = 'P0001';
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_reject_invite_for_member on public.circle_invites;
create trigger trg_reject_invite_for_member
before insert on public.circle_invites
for each row execute function public.reject_invite_for_member();

-- The invitee's queue. Group RLS hides non-member circles, so names arrive
-- through here, scoped to the caller's own verified phone.
create or replace function public.my_pending_invites()
returns table (
  invite_id uuid,
  group_id uuid,
  group_name text,
  inviter_name text,
  created_at timestamptz
)
as $$
  select ci.id, ci.group_id, g.name,
    coalesce(p.full_name, 'A member'), ci.created_at
  from public.circle_invites ci
  join public.groups g on g.id = ci.group_id
  left join public.profiles p on p.id = ci.inviter_user_id
  where ci.status = 'pending'
    and ci.invitee_phone = (
      select phone from public.profiles
      where id = auth.uid() and phone_verified = true
    )
  order by ci.created_at asc;
$$ language sql security definer stable;

-- Accept = file the same join request the link flow files (attribution =
-- inviter profile id, FK-safe; NULL when the inviter has since left), then
-- mark the nudge consumed. Idempotent: repeats return the current state.
-- Rejected-history reuse mirrors JoinRequestButton: a past rejection is
-- cleared so the accept starts a fresh vote; a live pending row is kept.
create or replace function public.accept_circle_invite(p_invite_id uuid)
returns text as $$
declare
  v_group uuid;
  v_inviter uuid;
  v_phone text;
  v_status text;
  v_mine text;
  v_inviter_valid boolean;
begin
  select group_id, inviter_user_id, invitee_phone, status
    into v_group, v_inviter, v_phone, v_status
  from public.circle_invites
  where id = p_invite_id;
  if not found then
    raise exception 'not_found';
  end if;

  select phone into v_mine from public.profiles
  where id = auth.uid() and phone_verified = true;
  if v_phone is distinct from v_mine then
    raise exception 'not_invited';
  end if;

  if v_status <> 'pending' then
    return v_status;
  end if;

  if exists (
    select 1 from public.group_members
    where group_id = v_group and user_id = auth.uid() and status = 'active'
  ) then
    update public.circle_invites set status = 'accepted' where id = p_invite_id;
    return 'already_member';
  end if;

  select exists (
    select 1 from public.group_members
    where group_id = v_group and user_id = v_inviter and status = 'active'
  ) into v_inviter_valid;

  delete from public.join_requests
  where group_id = v_group and applicant_id = auth.uid() and status = 'rejected';

  begin
    insert into public.join_requests (group_id, applicant_id, invited_by)
    values (
      v_group, auth.uid(),
      case when v_inviter_valid then v_inviter else null end
    );
  exception when unique_violation then
    update public.circle_invites set status = 'accepted' where id = p_invite_id;
    return 'already_pending';
  end;

  update public.circle_invites set status = 'accepted' where id = p_invite_id;
  return 'accepted';
end;
$$ language plpgsql security definer;

create or replace function public.decline_circle_invite(p_invite_id uuid)
returns text as $$
declare
  v_phone text;
  v_status text;
  v_mine text;
begin
  select invitee_phone, status into v_phone, v_status
  from public.circle_invites
  where id = p_invite_id;
  if not found then
    raise exception 'not_found';
  end if;

  select phone into v_mine from public.profiles
  where id = auth.uid() and phone_verified = true;
  if v_phone is distinct from v_mine then
    raise exception 'not_invited';
  end if;

  if v_status <> 'pending' then
    return v_status;
  end if;

  update public.circle_invites set status = 'declined' where id = p_invite_id;
  return 'declined';
end;
$$ language plpgsql security definer;
