-- Membership realtime for the circle workspace + circles directory.
-- Realtime only streams tables registered in the publication; RLS still
-- filters every event down to rows the subscriber can select, so no policy
-- change is needed here. Idempotent for dashboard re-runs.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'group_members'
  ) then
    alter publication supabase_realtime add table public.group_members;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'groups'
  ) then
    alter publication supabase_realtime add table public.groups;
  end if;
end
$$;
