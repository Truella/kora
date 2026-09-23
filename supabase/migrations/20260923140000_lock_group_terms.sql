-- Lock circle financial terms (multi-currency hardening).
--
-- 1. Currency whitelist: only the four Flutterwave corridors the app
--    prices, charges, and displays. A free-text currency could sail
--    through charge creation until Flutterwave rejects (or misprices) it.
-- 2. freeze_group_terms: contribution_amount/currency become immutable
--    once the circle activates (status <> 'forming') or a second member
--    joins — whichever comes first. This is what the creation form
--    promises ("Locked once members join"). Without it, a mid-rotation
--    currency switch would break the webhook's amount/currency re-check
--    for every in-flight pending contribution.
-- Applies to all future updates; existing rows are validated by the
-- CHECK on add (fails loudly if bad data exists — fix data first).

alter table public.groups
  drop constraint if exists groups_currency_allowed;

alter table public.groups
  add constraint groups_currency_allowed
  check (currency in ('NGN', 'GHS', 'KES', 'UGX'));

create or replace function public.freeze_group_terms()
returns trigger as $$
declare
  v_members int;
begin
  if new.contribution_amount is not distinct from old.contribution_amount
     and new.currency is not distinct from old.currency then
    return new;
  end if;

  if old.status <> 'forming' then
    raise exception
      'Contribution terms are locked once the circle is active';
  end if;

  select count(*) into v_members
  from public.group_members
  where group_id = old.id and status = 'active';

  if v_members > 1 then
    raise exception
      'Contribution terms are locked once members join';
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists on_group_terms_change on public.groups;

create trigger on_group_terms_change
  before update of contribution_amount, currency on public.groups
  for each row execute function public.freeze_group_terms();
