-- Explicit circle lifecycle states: Active / Paused / Completed.
--
-- `forming` stays as the internal pre-launch state (no cycles yet). The new
-- user-visible `paused` state freezes dues: the app excludes paused circles
-- from owed/attention/NextUp (see src/lib/home.ts) and shows a "Paused"
-- panel on the card instead of the progress bar.
--
-- Allowed transitions:
--   forming -> active   (schedule generator, as before)
--   active <-> paused   (organizer pause / resume)
--   active -> completed (close-out, as before)
--   paused -> completed (organizer closes while paused)
-- completed is terminal; forming can never be re-entered.

alter table public.groups drop constraint if exists groups_status_check;
alter table public.groups
  add constraint groups_status_check
  check (status in ('forming', 'active', 'paused', 'completed'));

create or replace function public.lock_group_governance()
returns trigger as $$
declare
  v_members int;
begin
  if new.vote_threshold is not distinct from old.vote_threshold
     and new.frequency is not distinct from old.frequency
     and new.status is not distinct from old.status then
    return new;
  end if;

  -- Explicit lifecycle for status.
  if new.status is distinct from old.status then
    if not ((old.status = 'forming' and new.status = 'active')
            or (old.status = 'active' and new.status in ('paused', 'completed'))
            or (old.status = 'paused' and new.status in ('active', 'completed'))) then
      raise exception
        'Circle status must follow forming → active ↔ paused → completed (completed is terminal)';
    end if;
  end if;

  -- Threshold/frequency freeze gate (mirrors freeze_group_terms).
  if new.vote_threshold is distinct from old.vote_threshold
     or new.frequency is distinct from old.frequency then
    if old.status <> 'forming' then
      raise exception
        'Voting rules are locked once the circle is active';
    end if;

    select count(*) into v_members
    from public.group_members
    where group_id = old.id and status = 'active';

    if v_members > 1 then
      raise exception
        'Voting rules are locked once members join';
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists on_group_governance_change on public.groups;

create trigger on_group_governance_change
  before update of vote_threshold, frequency, status on public.groups
  for each row execute function public.lock_group_governance();
