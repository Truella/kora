-- Promise timestamp on contributions (scope-audit small-fix batch).
--
-- Pending rows previously carried no "when did you promise" date, so the
-- ledger could only order them by cycle due date. New rows are stamped
-- automatically via the column default (create-charge inserts
-- service-side without listing columns, so the default covers it).
--
-- Deliberate backfill choice (per 9/23 grill): existing rows stay NULL
-- rather than receiving a fake now() stamp — rewriting history on a
-- trust ledger is worse than a gap. The ledger keeps sorting NULL rows
-- by due date (same as today), so pre-migration rows render unchanged.
-- Applies cleanly on empty or populated tables: nullable add, no rewrite.

alter table public.contributions
  add column if not exists created_at timestamptz;

alter table public.contributions
  alter column created_at set default now();
