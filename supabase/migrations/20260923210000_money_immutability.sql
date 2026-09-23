-- Money append-only guard (bad-fix batch, Phase 3).
--
-- The ledger was read-only from clients but had no tamper-evidence:
-- a service-side paid → pending flip or row delete would be silent.
-- Now the only allowed writes are the forward transitions the
-- payment flow actually performs:
--   contributions: pending → paid | late (webhook-verified arrivals)
--   payouts:       pending → completed | failed (future disbursement)
-- Everything else — backward moves, settled-row edits, any delete —
-- raises. Strict by choice (no service-role hatch): legitimate
-- repairs go through a migration, which must disable the relevant
-- trigger first and re-enable it after, leaving full visibility.
-- (Group/cycle deletes have no app path and no RLS delete policy,
-- so blocking money deletes breaks no cascade the app can reach.)

create or replace function public.guard_contribution_transition()
returns trigger as $$
begin
  if TG_OP = 'DELETE' then
    raise exception 'Contributions cannot be deleted (append-only ledger)';
  end if;

  if old.status = 'pending'
     and (new.status = 'paid' or new.status = 'late') then
    return new;
  end if;

  raise exception
    'Contributions are append-only: only pending → paid | late allowed';
end;
$$ language plpgsql;

drop trigger if exists on_contribution_immutable on public.contributions;

create trigger on_contribution_immutable
  before update or delete on public.contributions
  for each row execute function public.guard_contribution_transition();

create or replace function public.guard_payout_transition()
returns trigger as $$
begin
  if TG_OP = 'DELETE' then
    raise exception 'Payouts cannot be deleted (append-only ledger)';
  end if;

  if old.status = 'pending'
     and (new.status = 'completed' or new.status = 'failed') then
    return new;
  end if;

  raise exception
    'Payouts are append-only: only pending → completed | failed allowed';
end;
$$ language plpgsql;

drop trigger if exists on_payout_immutable on public.payouts;

create trigger on_payout_immutable
  before update or delete on public.payouts
  for each row execute function public.guard_payout_transition();
