-- Future API objects start closed; every new migration must grant deliberately.
-- PostgreSQL's built-in PUBLIC EXECUTE default is global: a schema-scoped
-- revoke alone cannot remove it.
alter default privileges revoke execute on functions from public, anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges in schema private revoke execute on functions from public, anon, authenticated;

-- A former coaching relationship must not retain access to the other profile.
alter policy profiles_read on public.profiles using (id = auth.uid() or exists(
  select 1 from public.coach_clients c where c.status in ('invited', 'active') and
    ((c.coach_id = auth.uid() and c.client_id = profiles.id)
      or (c.client_id = auth.uid() and c.coach_id = profiles.id))));

create trigger immutable_exercise_parent before update on public.exercises
for each row execute function private.immutable_parent('owner_coach_id');
create trigger immutable_instruction_parent before update on public.exercise_instructions
for each row execute function private.immutable_parent('exercise_id');
create trigger immutable_relationship_coach before update on public.coach_clients
for each row execute function private.immutable_parent('coach_id');
create trigger immutable_relationship_client before update on public.coach_clients
for each row execute function private.immutable_parent('client_id');

-- Catalogue changes must not let new selections reuse a retired movement. Existing
-- prescriptions/actuals retain their references and remain readable as history.
create or replace function private.validate_exercise_selection() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.exercise_id is not distinct from old.exercise_id then return new; end if;
  if new.exercise_id is not null and exists(select 1 from public.exercises where id = new.exercise_id and retired_at is not null) then
    raise exception 'Retired exercise cannot be newly selected' using errcode = '23514';
  end if;
  return new;
end;
$$;
-- Starting an unchanged historical prescription is allowed. New extras and
-- substitutions are validated in their commands, not on snapshot creation.
create trigger validate_proposed_exercise before insert or update of exercise_id on public.proposed_exercises
for each row execute function private.validate_exercise_selection();

create function private.validate_actual_selection() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' and not coalesce((new.applied_snapshot->>'extra')::boolean, false) then return new; end if;
  if tg_op = 'UPDATE' and new.exercise_id is not distinct from old.exercise_id then return new; end if;
  if new.exercise_id is not null and exists(select 1 from public.exercises where id = new.exercise_id and retired_at is not null) then
    raise exception 'Retired exercise cannot be newly selected' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger validate_actual_selection before insert or update of exercise_id on public.workout_exercises
for each row execute function private.validate_actual_selection();
revoke all on function private.validate_actual_selection() from public, anon, authenticated;

-- JSON targets also need constraints when written through trusted table APIs.
create function private.validate_targets() returns trigger language plpgsql set search_path = '' as $$
declare target jsonb;
begin
  if jsonb_typeof(new.targets) is distinct from 'array' then
    raise exception 'Targets must be an array' using errcode = '23514';
  end if;
  for target in select value from jsonb_array_elements(new.targets) loop
    if jsonb_typeof(target) is distinct from 'object'
      or coalesce((target->>'position')::integer, 0) <= 0
      or (target->>'load_kg')::numeric < 0 or (target->>'load_kg')::numeric >= 'Infinity'::numeric
      or (target->>'reps_min')::integer <= 0
      or (target->>'reps_max')::integer < (target->>'reps_min')::integer
      or (target->>'reps_max' is not null and target->>'reps_min' is null)
      or (target->>'rir')::numeric not between 0 and 10
      or (target->>'rest_seconds')::integer < 0 then
      raise exception 'Invalid target values' using errcode = '23514';
    end if;
  end loop;
  if exists(select 1 from jsonb_array_elements(new.targets) t group by (t->>'position')::integer having count(*) > 1) then
    raise exception 'Duplicate target positions' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger validate_targets before insert or update of targets on public.proposed_exercises
for each row execute function private.validate_targets();
revoke all on function private.validate_targets() from public, anon, authenticated;

-- Required foreign-key lookups for RLS, historical restrictions and parent deletes.
create index on public.coach_clients(coach_id, status);
create index on public.exercise_prescriptions(exercise_id);
create index on public.adaptation_proposals(conversation_id, client_id);
create index on public.conversations(client_id);
create index on public.proposal_sessions(session_id);
create index on public.proposed_exercises(exercise_id);
create index on public.proposal_exercise_sources(prescription_id);
create index on public.workout_sources(session_id);
create index on public.workouts(applied_by);
create index on public.workout_exercises(exercise_id);
create index on public.workout_exercise_sources(prescription_id);
