-- Join-request realtime for the circle overview.
-- Realtime only streams tables registered in the publication; RLS still
-- filters every event down to groups the subscriber actively belongs to,
-- so no policy change is needed here. Idempotent for dashboard re-runs.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'join_requests'
  ) then
    alter publication supabase_realtime add table public.join_requests;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'join_votes'
  ) then
    alter publication supabase_realtime add table public.join_votes;
  end if;
end
$$;
