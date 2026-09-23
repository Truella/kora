# Database Schema — Digital Ajo/Chama App (Supabase)

Run sections in order. Written for Supabase Postgres (uses `auth.users`, `auth.uid()`, RLS).

---

## 0. Extensions

```sql
create extension if not exists "uuid-ossp";
```

---

## 1. Tables

### profiles

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text unique,
  phone_verified boolean not null default false,
  avatar_url text,
  created_at timestamptz not null default now()
);
```

Phone is the anchor identity: USSD has no concept of email — the USSD
webhook identifies callers by looking up `profiles.phone` with an exact
string match. That is why `phone` must always be stored in E.164 format
(`+234…`, `+254…`, `+256…`, `+233…`): any formatting inconsistency
(spaces, local `0…` prefixes, missing `+`) silently breaks the USSD lookup.
The DB enforces the shape (`profiles_phone_e164` check, see migration
below); the app normalizes input centrally in `src/lib/phone.ts`
(`normalizeToE164`) before every write.

`phone` stays nullable at the DB level because email-signup users have no
phone until they complete the add-phone flow — but it is required at the
app level for full functionality (anything USSD-related is gated on
`phone_verified = true`). `phone_verified` is set by the app after a
successful phone OTP verification; the existing "update own profile"
policy already covers that write, so no new RLS policy was needed —
but migration `20260923190000_guard_phone_verification.sql` adds the
`guard_phone_verification` trigger on top, so a false→true flip (or a
number change under a true stamp) only sticks when the digits match the
auth user's OTP'd phone. Console self-grants fail; both OTP flows pass.

Migration (`supabase/migrations/*_add_phone_verification.sql` — already
applied, do not re-run from scratch; new environments run all migrations
in order):

```sql
alter table public.profiles
  add column if not exists phone_verified boolean not null default false;

alter table public.profiles
  drop constraint if exists profiles_phone_e164;
alter table public.profiles
  add constraint profiles_phone_e164
  check (phone is null or phone ~ '^\+[1-9][0-9]{6,14}$');

comment on column public.profiles.phone is
  'Subscriber identity. Nullable for email-signup users; required (app-level) for USSD access. Always E.164 — the USSD webhook matches this column by exact string.';
comment on column public.profiles.phone_verified is
  'True once the user completes phone OTP verification. Set by the app after verify; readable/writable by the owner via the existing "update own profile" policy — no new RLS policy.';
```

Auto-create a profile row whenever a new auth user signs up. The phone is
normalized to canonical E.164 inside the trigger (strip separators, ensure
leading `+`) because auth sources don't guarantee the format — dashboard
test SMS numbers arrive without the `+`, which once broke signup against
the `profiles_phone_e164` check:

```sql
create function public.handle_new_user()
returns trigger as $$
declare
  v_phone text;
begin
  if new.phone is not null then
    v_phone := regexp_replace(new.phone, '[\s\-().]', '', 'g');
    if v_phone <> '' and left(v_phone, 1) <> '+' then
      v_phone := '+' || v_phone;
    end if;
    if v_phone = '' then
      v_phone := null;
    end if;
  end if;

  insert into public.profiles (id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), v_phone);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### groups

```sql
create table public.groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  created_by uuid not null references public.profiles(id),
  contribution_amount numeric(12,2) not null,
  currency text not null default 'NGN'
    check (currency in ('NGN', 'GHS', 'KES', 'UGX')),
  frequency text not null check (frequency in ('weekly','monthly')),  vote_threshold numeric(3,2) not null default 0.60,
  status text not null default 'forming' check (status in ('forming','active','completed')),
  created_at timestamptz not null default now()
);
```

### group_members

```sql
create table public.group_members (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  invited_by uuid references public.profiles(id),
  status text not null default 'active' check (status in ('pending','active','removed')),
  payout_position int,
  trust_score_cache numeric(5,2) not null default 100.00,
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);
```

### join_requests

```sql
create table public.join_requests (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.groups(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id),
  invited_by uuid references public.profiles(id),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  unique (group_id, applicant_id)
);
```

### join_votes

```sql
create table public.join_votes (
  id uuid primary key default uuid_generate_v4(),
  join_request_id uuid not null references public.join_requests(id) on delete cascade,
  voter_id uuid not null references public.group_members(id),
  vote text not null check (vote in ('approve','reject')),
  created_at timestamptz not null default now(),
  unique (join_request_id, voter_id)
);
```

### cycles

```sql
create table public.cycles (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.groups(id) on delete cascade,
  cycle_number int not null,
  recipient_member_id uuid not null references public.group_members(id),
  due_date date not null,
  status text not null default 'upcoming' check (status in ('upcoming','active','completed')),
  unique (group_id, cycle_number)
);
```

### contributions

```sql
create table public.contributions (
  id uuid primary key default uuid_generate_v4(),
  cycle_id uuid not null references public.cycles(id) on delete cascade,
  member_id uuid not null references public.group_members(id),
  amount numeric(12,2) not null,
  status text not null default 'pending' check (status in ('pending','paid','late')),
  payment_reference text,
  paid_at timestamptz,
  created_at timestamptz default now(), -- promise stamp; pre-migration rows stay NULL by choice (no rewritten history), ledger sorts those by due date
  unique (cycle_id, member_id)
);
```

### payouts

```sql
create table public.payouts (
  id uuid primary key default uuid_generate_v4(),
  cycle_id uuid not null unique references public.cycles(id) on delete cascade,
  recipient_member_id uuid not null references public.group_members(id),
  amount numeric(12,2) not null,
  status text not null default 'pending' check (status in ('pending','completed','failed')),
  payout_reference text,
  paid_at timestamptz
);
```

---

## 2. Indexes

```sql
create index idx_group_members_group on public.group_members(group_id);
create index idx_group_members_user on public.group_members(user_id);
create index idx_join_requests_group on public.join_requests(group_id, status);
create index idx_join_votes_request on public.join_votes(join_request_id);
create index idx_cycles_group on public.cycles(group_id);
create index idx_contributions_cycle on public.contributions(cycle_id);
create index idx_contributions_member on public.contributions(member_id);
```

---

## 3. Business Logic Functions

### 3a. Auto-add creator as first member on group creation

```sql
create function public.handle_new_group()
returns trigger as $$
begin
  insert into public.group_members (group_id, user_id, invited_by, status, payout_position)
  values (new.id, new.created_by, new.created_by, 'active', 1);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_group_created
  after insert on public.groups
  for each row execute function public.handle_new_group();
```

### 3b. Tally votes after every new vote — auto-approve/reject at threshold

Runs as `security definer` so it can update `join_requests` and insert into `group_members` even though regular users have no direct write access to either (see RLS section — this is the *only* path membership changes through).

```sql
create function public.tally_join_votes()
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

  if v_approve_votes::numeric / v_active_members >= v_threshold then
    update public.join_requests set status = 'approved' where id = new.join_request_id;

    select coalesce(max(payout_position), 0) + 1 into v_next_position
    from public.group_members where group_id = v_group_id;

    insert into public.group_members (group_id, user_id, invited_by, status, payout_position)
    values (v_group_id, v_applicant_id, v_invited_by, 'active', v_next_position);

  elsif v_reject_votes::numeric / v_active_members > (1 - v_threshold) then
    update public.join_requests set status = 'rejected' where id = new.join_request_id;
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_join_vote_cast
  after insert on public.join_votes
  for each row execute function public.tally_join_votes();
```

### 3c. Update trust score when a contribution is marked paid/late

```sql
create function public.update_trust_score()
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

create trigger on_contribution_status_change
  after update of status on public.contributions
  for each row
  when (old.status is distinct from new.status)
  execute function public.update_trust_score();
```

> Note: `contributions.status` and `payouts.*` should only ever be written by an Edge Function using the service role key, after verifying the Paystack/Flutterwave webhook — never trust a client-reported "I paid." RLS below blocks direct client writes to these tables entirely.

---

## 4. Row Level Security

Enable RLS on every table first:

```sql
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.join_requests enable row level security;
alter table public.join_votes enable row level security;
alter table public.cycles enable row level security;
alter table public.contributions enable row level security;
alter table public.payouts enable row level security;
```

Helper: check if a user is an active member of a group.

```sql
create function public.is_active_member(p_group_id uuid, p_user_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = p_user_id and status = 'active'
  );
$$ language sql security definer stable;
```

### profiles

```sql
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

create policy "update own profile"
on public.profiles for update
using (id = auth.uid());
```

Guarded by migration `20260923190000_guard_phone_verification.sql`: the `guard_phone_verification` trigger requires a false→true `phone_verified` flip (or a number change under a true stamp) to match the auth user's OTP'd phone digits — console self-grants fail, real `sms`/`phone_change` flows pass, service-role/owner writes stay allowed for repairs.

### groups

```sql
create policy "view groups you belong to"
on public.groups for select
using (public.is_active_member(id, auth.uid()));

create policy "create group"
on public.groups for insert
with check (created_by = auth.uid());

create policy "creator updates non-financial fields"
on public.groups for update
using (created_by = auth.uid());
```

*(Consider restricting which columns can change via a `before update` trigger — e.g. block changes to `contribution_amount` after status = 'active'.)*

Locked by migration `20260923140000_lock_group_terms.sql`: `groups_currency_allowed` check (`NGN`/`GHS`/`KES`/`UGX` only) plus the `freeze_group_terms` trigger — `contribution_amount`/`currency` updates raise once the group is no longer `forming` or a second active member exists. This is what the creation form promises ("Locked once members join"); without it a mid-rotation switch would break the payment webhook's amount/currency re-check for in-flight contributions.

Locked further by migration `20260923160000_lock_group_governance.sql`: the `lock_group_governance` trigger freezes `vote_threshold`/`frequency` under the same gate (active or second member joined), and `status` may only move forward (`forming` → `active` → `completed`, so the generator's flip still works). Name/description stay editable always.

### group_members

```sql
create policy "view members of your groups"
on public.group_members for select
using (public.is_active_member(group_id, auth.uid()));
```

No client-facing insert/update/delete policy — membership is written only by the `handle_new_group` and `tally_join_votes` security-definer functions.

### join_requests

```sql
create policy "view join requests in your groups"
on public.join_requests for select
using (public.is_active_member(group_id, auth.uid()));

create policy "apply to join"
on public.join_requests for insert
with check (
  applicant_id = auth.uid()
  and (
    invited_by is null
    or public.is_valid_inviter(group_id, invited_by)
  )
);

create policy "applicants view own requests"
on public.join_requests for select
using (applicant_id = auth.uid());

create policy "applicants delete own rejected requests"
on public.join_requests for delete
using (
  applicant_id = auth.uid()
  and status = 'rejected'
);
```

No update policy for regular users — status flips only via `tally_join_votes`.

Migration `20260923150000_applicant_view_own_requests.sql` (Day 5B): lets the join page read the caller's own rows (status only, never vote counts — applicant-blindness stays) so it can render "still voting" vs re-apply copy. Members' views unchanged.

Migration `20260923180000_vote_integrity.sql` (bad-fix): `can_cast_vote()` helper tightens the vote insert check to same-circle voters (closes the cross-group hole); `tally_join_votes` rewritten with a pending-only terminal guard (late votes recorded but inert) plus conflict-safe member insert.

Migration `20260923200000_invite_attribution.sql` (bad-fix): `is_valid_inviter()` enforces inviter-must-be-active-member-of-that-circle at insert time (faked ids fail, app retries bare → NULL); adds the rejected-only applicant delete policy so declined applicants can ask again without ever wiping a pending tally (vote-reset exploit closed). Re-application is now allowed — the old "blocked by unique constraint, deliberate" note is superseded.

### join_votes

```sql
create policy "view votes in your groups"
on public.join_votes for select
using (
  exists (
    select 1 from public.join_requests jr
    where jr.id = join_request_id
    and public.is_active_member(jr.group_id, auth.uid())
  )
);

create policy "cast vote as active member"
on public.join_votes for insert
with check (public.can_cast_vote(join_request_id, voter_id));
```

`can_cast_vote()` (migration `20260923180000_vote_integrity.sql`) restricts voters to active members of the request's own circle — cross-group voting fails the check.

### cycles

```sql
create policy "view cycles in your groups"
on public.cycles for select
using (public.is_active_member(group_id, auth.uid()));
```

No client insert/update — cycles are generated by an Edge Function when a group activates.

### contributions

```sql
create policy "view contributions in your groups"
on public.contributions for select
using (
  exists (
    select 1 from public.cycles c
    where c.id = cycle_id and public.is_active_member(c.group_id, auth.uid())
  )
);
```

No client insert/update — written only by the payment-webhook Edge Function (service role bypasses RLS).

Append-only since migration `20260923210000_money_immutability.sql`: only `pending → paid | late` transitions and no deletes — anything else raises, including for the service role (repairs go through a migration that disables/re-enables the trigger).

### payouts

```sql
create policy "view payouts in your groups"
on public.payouts for select
using (
  exists (
    select 1 from public.cycles c
    where c.id = cycle_id and public.is_active_member(c.group_id, auth.uid())
  )
);
```

No client insert/update — written only by the payout-processing Edge Function.

Append-only since migration `20260923210000_money_immutability.sql`: only `pending → completed | failed` transitions and no deletes — anything else raises, including for the service role (repairs go through a migration that disables/re-enables the trigger).

---

## 5. What still needs an Edge Function (service role, bypasses RLS)

1. **Payment webhook handler** — receives Paystack/Flutterwave confirmation, writes `contributions.status = 'paid'` + `payment_reference` — or `'late'` when the money arrives after the cycle's `due_date` (Day 5B late rule; this is what moves trust scores off 100 via the existing `update_trust_score` trigger).
2. **Payout processor** — on cycle due date, triggers split payment to recipient, writes `payouts` row.
3. **Cycle generator** — on group activation (once membership is stable), creates one `cycles` row per member per rotation, in `payout_position` order.

These three are the only places money-adjacent state changes — everything else (votes, membership, trust score) is enforced entirely by triggers and RLS inside Postgres.
