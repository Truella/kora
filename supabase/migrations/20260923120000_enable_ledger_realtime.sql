-- Day 4A: live ledger view.
-- Realtime only streams tables registered in the publication; RLS still
-- filters every event down to groups the subscriber actively belongs to,
-- so no policy change is needed here. Idempotent for dashboard re-runs.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'contributions'
  ) then
    alter publication supabase_realtime add table public.contributions;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'payouts'
  ) then
    alter publication supabase_realtime add table public.payouts;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'cycles'
  ) then
    alter publication supabase_realtime add table public.cycles;
  end if;
end
$$;
