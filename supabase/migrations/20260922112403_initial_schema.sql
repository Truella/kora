-- Initial schema — Digital Ajo/Chama App
-- Source: docs/DATABASE_SCHEMA.md (sections run in order)
-- Project: kora (xbjqcqklsifqvgmpqbvq)

-- 0. Extensions
create extension if not exists "uuid-ossp";

-- 1. Tables

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text unique,
  avatar_url text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.phone);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid not null references public.profiles(id),
  contribution_amount numeric(12,2) not null,
  currency text not null default 'NGN',
  frequency text not null check (frequency in ('weekly','monthly')),
  vote_threshold numeric(3,2) not null default 0.60,
  status text not null default 'forming' check (status in ('forming','active','completed')),
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  invited_by uuid references public.profiles(id),
  status text not null default 'active' check (status in ('pending','active','removed')),
  payout_position int,
  trust_score_cache numeric(5,2) not null default 100.00,
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create table if not exists public.join_requests (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id),
  invited_by uuid references public.profiles(id),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  unique (group_id, applicant_id)
);

create table if not exists public.join_votes (
  id uuid primary key default gen_random_uuid(),
  join_request_id uuid not null references public.join_requests(id) on delete cascade,
  voter_id uuid not null references public.group_members(id),
  vote text not null check (vote in ('approve','reject')),
  created_at timestamptz not null default now(),
  unique (join_request_id, voter_id)
);

create table if not exists public.cycles (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  cycle_number int not null,
  recipient_member_id uuid not null references public.group_members(id),
  due_date date not null,
  status text not null default 'upcoming' check (status in ('upcoming','active','completed')),
  unique (group_id, cycle_number)
);

create table if not exists public.contributions (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.cycles(id) on delete cascade,
  member_id uuid not null references public.group_members(id),
  amount numeric(12,2) not null,
  status text not null default 'pending' check (status in ('pending','paid','late')),
  payment_reference text,
  paid_at timestamptz,
  unique (cycle_id, member_id)
);

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null unique references public.cycles(id) on delete cascade,
  recipient_member_id uuid not null references public.group_members(id),
  amount numeric(12,2) not null,
  status text not null default 'pending' check (status in ('pending','completed','failed')),
  payout_reference text,
  paid_at timestamptz
);

-- 2. Indexes
create index if not exists idx_group_members_group on public.group_members(group_id);
create index if not exists idx_group_members_user on public.group_members(user_id);
create index if not exists idx_join_requests_group on public.join_requests(group_id, status);
create index if not exists idx_join_votes_request on public.join_votes(join_request_id);
create index if not exists idx_cycles_group on public.cycles(group_id);
create index if not exists idx_contributions_cycle on public.contributions(cycle_id);
create index if not exists idx_contributions_member on public.contributions(member_id);

-- 3a. Auto-add creator as first member on group creation
create or replace function public.handle_new_group()
returns trigger as $$
begin
  insert into public.group_members (group_id, user_id, invited_by, status, payout_position)
  values (new.id, new.created_by, new.created_by, 'active', 1);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_group_created on public.groups;
create trigger on_group_created
  after insert on public.groups
  for each row execute function public.handle_new_group();

-- 3b. Tally votes after every new vote — auto-approve/reject at threshold
create or replace function public.tally_join_votes()
returns trigger as $$
declare
  v_group_id uuid;
  v_applicant_id uuid;
  v_invited_by uuid;
  v_threshold numeric(3,2);
  v_active_members int;
  v_approve_votes int;
  v_reject_votes int;
  v_next_position int;
begin
  select jr.group_id, jr.applicant_id, jr.invited_by, g.vote_threshold
    into v_group_id, v_applicant_id, v_invited_by, v_threshold
  from public.join_requests jr
  join public.groups g on g.id = jr.group_id
  where jr.id = new.join_request_id;

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

    insert into public.group_members (group_id, user_id, invited_by, status, payout_position)
    values (v_group_id, v_applicant_id, v_invited_by, 'active', v_next_position);

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

-- 3c. Update trust score when a contribution is marked paid/late
create or replace function public.update_trust_score()
returns trigger as $$
declare
  v_total int;
  v_on_time int;
begin
  select count(*) filter (where status in ('paid','late')),
         count(*) filter (where status = 'paid')
    into v_total, v_on_time
  from public.contributions
  where member_id = new.member_id;

  update public.group_members
  set trust_score_cache = case when v_total = 0 then 100
                                else round((v_on_time::numeric / v_total) * 100, 2) end
  where id = new.member_id;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_contribution_status_change on public.contributions;
create trigger on_contribution_status_change
  after update of status on public.contributions
  for each row
  when (old.status is distinct from new.status)
  execute function public.update_trust_score();

-- 4. Row Level Security
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.join_requests enable row level security;
alter table public.join_votes enable row level security;
alter table public.cycles enable row level security;
alter table public.contributions enable row level security;
alter table public.payouts enable row level security;

create or replace function public.is_active_member(p_group_id uuid, p_user_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = p_user_id and status = 'active'
  );
$$ language sql security definer stable;

-- profiles
drop policy if exists "view own or shared-group profiles" on public.profiles;
create policy "view own or shared-group profiles"
on public.profiles for select
using (
  id = auth.uid()
  or exists (
    select 1 from public.group_members gm1
    join public.group_members gm2 on gm1.group_id = gm2.group_id
    where gm1.user_id = auth.uid() and gm2.user_id = profiles.id
  )
);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile"
on public.profiles for update
using (id = auth.uid());

-- groups
drop policy if exists "view groups you belong to" on public.groups;
create policy "view groups you belong to"
on public.groups for select
using (public.is_active_member(id, auth.uid()));

drop policy if exists "create group" on public.groups;
create policy "create group"
on public.groups for insert
with check (created_by = auth.uid());

drop policy if exists "creator updates non-financial fields" on public.groups;
create policy "creator updates non-financial fields"
on public.groups for update
using (created_by = auth.uid());

-- group_members (select only — writes via security-definer functions)
drop policy if exists "view members of your groups" on public.group_members;
create policy "view members of your groups"
on public.group_members for select
using (public.is_active_member(group_id, auth.uid()));

-- join_requests
drop policy if exists "view join requests in your groups" on public.join_requests;
create policy "view join requests in your groups"
on public.join_requests for select
using (public.is_active_member(group_id, auth.uid()));

drop policy if exists "apply to join" on public.join_requests;
create policy "apply to join"
on public.join_requests for insert
with check (applicant_id = auth.uid());

-- join_votes
drop policy if exists "view votes in your groups" on public.join_votes;
create policy "view votes in your groups"
on public.join_votes for select
using (
  exists (
    select 1 from public.join_requests jr
    where jr.id = join_request_id
    and public.is_active_member(jr.group_id, auth.uid())
  )
);

drop policy if exists "cast vote as active member" on public.join_votes;
create policy "cast vote as active member"
on public.join_votes for insert
with check (
  voter_id in (
    select id from public.group_members
    where user_id = auth.uid() and status = 'active'
  )
);

-- cycles (select only — generated by Edge Function)
drop policy if exists "view cycles in your groups" on public.cycles;
create policy "view cycles in your groups"
on public.cycles for select
using (public.is_active_member(group_id, auth.uid()));

-- contributions (select only — written by payment-webhook Edge Function)
drop policy if exists "view contributions in your groups" on public.contributions;
create policy "view contributions in your groups"
on public.contributions for select
using (
  exists (
    select 1 from public.cycles c
    where c.id = cycle_id and public.is_active_member(c.group_id, auth.uid())
  )
);

-- payouts (select only — written by payout-processing Edge Function)
drop policy if exists "view payouts in your groups" on public.payouts;
create policy "view payouts in your groups"
on public.payouts for select
using (
  exists (
    select 1 from public.cycles c
    where c.id = cycle_id and public.is_active_member(c.group_id, auth.uid())
  )
);
