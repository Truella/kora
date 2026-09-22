-- Fix "Database error saving new user" on phone signup.
--
-- Root cause: dashboard test SMS numbers (and some carriers) reach
-- auth.users.phone without the leading "+" (e.g. "2348000000001").
-- handle_new_user() copied that verbatim into profiles.phone, violating
-- the profiles_phone_e164 check and aborting the whole signup.
--
-- Fix: normalize to canonical E.164 inside the trigger — strip separators,
-- ensure the leading "+". The app-level normalizer (src/lib/phone.ts)
-- still owns user input; this is the last line of defense at the DB edge
-- so no auth path can ever store a non-canonical number (the USSD webhook
-- depends on exact-match lookups).

create or replace function public.handle_new_user()
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
