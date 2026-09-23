-- Guard phone_verified (bad-fix batch, Phase 2).
--
-- The verify page stamps { phone, phone_verified: true } from the
-- client after verifyOtp succeeds — but the "update own profile" RLS
-- rule checks identity only, so anyone could run the same update from
-- the console with an untexted number and self-grant USSD access.
--
-- This trigger closes it: flipping phone_verified false → true (or
-- changing the number under a true stamp, which covers the add-phone
-- re-verify path) requires the new number's digits to equal the
-- auth user's phone digits — i.e. a number Supabase actually OTP'd.
-- Digit-compare (not exact) so +-less test-SMS numbers keep working.
-- Real login (sms) and add-phone (phone_change) flows both pass
-- unchanged; email users with no phone can never match (NULL fails).
--
-- Service-role / owner writes (auth.uid() NULL) are allowed: repairs
-- and migrations must remain possible, and the service key already
-- bypasses everything. Console attackers always carry a uid, so the
-- bypass is unreachable to them.

create or replace function public.guard_phone_verification()
returns trigger as $$
declare
  v_auth_phone text;
begin
  if new.phone_verified = true
     and (old.phone_verified is distinct from true
          or new.phone is distinct from old.phone) then
    if auth.uid() is null then
      return new;
    end if;

    select phone into v_auth_phone
    from auth.users
    where id = auth.uid();

    if v_auth_phone is null
       or new.phone is null
       or regexp_replace(v_auth_phone, '\D', '', 'g')
          != regexp_replace(new.phone, '\D', '', 'g') then
      raise exception
        'Phone number must be verified by code before marking verified';
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_profile_phone_guard on public.profiles;

create trigger on_profile_phone_guard
  before update of phone, phone_verified on public.profiles
  for each row execute function public.guard_phone_verification();
