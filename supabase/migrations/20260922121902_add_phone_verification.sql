-- Phone-primary auth: anchor identity on phone for the USSD lookup path.
-- Email-path users exist without a phone until they complete the add-phone flow.

-- 1. Verified flag. Existing rows (if any) backfill to false.
alter table public.profiles
  add column if not exists phone_verified boolean not null default false;

-- 2. phone stays nullable at the DB level: email-signup users have no phone
-- yet. Full functionality (anything USSD-related) requires one — enforced
-- at the app level, not here.

-- 3. E.164 shape enforcement. The USSD webhook looks up profiles by exact
-- string match on phone, so any formatting inconsistency breaks that lookup.
-- NULL is allowed (email-path users); any non-null value must be E.164
-- (+234… NG, +254… KE, +256… UG, +233… GH).
alter table public.profiles
  drop constraint if exists profiles_phone_e164;
alter table public.profiles
  add constraint profiles_phone_e164
  check (phone is null or phone ~ '^\+[1-9][0-9]{6,14}$');

comment on column public.profiles.phone is
  'Subscriber identity. Nullable for email-signup users; required (app-level) for USSD access. Always E.164 — the USSD webhook matches this column by exact string.';
comment on column public.profiles.phone_verified is
  'True once the user completes phone OTP verification. Set by the app after verify; readable/writable by the owner via the existing "update own profile" policy — no new RLS policy.';
