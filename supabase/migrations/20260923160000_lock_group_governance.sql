-- Lock circle governance terms (scope-audit small-fix batch).
--
-- freeze_group_terms already locks contribution_amount/currency. This
-- extends the same promise to vote_threshold and frequency: they become
-- immutable once the circle activates (status <> 'forming') or a second
-- member joins — whichever comes first. Name/description stay editable
-- always (typo fixes must not need a migration).
--
-- Status itself may only move forward (forming → active → completed).
-- The generator's forming → active flip runs as the service role, which
-- bypasses RLS but NOT triggers — so the forward transition is
-- explicitly allowed here, otherwise schedule generation would break.
-- Backward moves (active → forming, completed → anything) are rejected.

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

  -- Forward-only lifecycle for status.
  if new.status is distinct from old.status then
    if not ((old.status = 'forming' and new.status = 'active')
            or (old.status = 'active' and new.status = 'completed')) then
      raise exception
        'Circle status can only move forward (forming → active → completed)';
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
