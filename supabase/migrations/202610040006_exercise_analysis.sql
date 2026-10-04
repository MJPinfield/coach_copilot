-- Source labels remain untouched. Curated classifications are append-only revisions.
create table public.muscle_groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z][a-z0-9_]*$'),
  name text not null check (length(trim(name)) between 1 and 100)
);
create table public.muscles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z][a-z0-9_]*$'),
  name text not null check (length(trim(name)) between 1 and 100)
);
create table public.muscle_group_members (
  muscle_group_id uuid not null references public.muscle_groups,
  muscle_id uuid not null references public.muscles,
  primary key (muscle_group_id, muscle_id)
);
create index on public.muscle_group_members(muscle_id);
create table public.exercise_families (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z][a-z0-9_]*$'),
  name text not null check (length(trim(name)) between 1 and 100)
);
create table public.exercise_analysis_revisions (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercises,
  revision integer not null check (revision > 0),
  family_id uuid references public.exercise_families,
  provenance text not null check (provenance in ('imported', 'coach_reviewed')),
  source_reference text not null check (length(trim(source_reference)) between 1 and 1000),
  reviewed_by uuid references public.profiles,
  created_at timestamptz not null default now(),
  unique (exercise_id, revision),
  check ((provenance = 'coach_reviewed') = (reviewed_by is not null))
);
create index on public.exercise_analysis_revisions(family_id);
create index on public.exercise_analysis_revisions(reviewed_by);
create table public.exercise_muscle_mappings (
  id uuid primary key default gen_random_uuid(),
  revision_id uuid not null references public.exercise_analysis_revisions,
  muscle_group_id uuid references public.muscle_groups,
  muscle_id uuid references public.muscles,
  role text not null check (role in ('primary', 'secondary', 'stabiliser')),
  check (num_nonnulls(muscle_group_id, muscle_id) = 1),
  unique (revision_id, muscle_group_id),
  unique (revision_id, muscle_id)
);
create index on public.exercise_muscle_mappings(muscle_group_id);
create index on public.exercise_muscle_mappings(muscle_id);

-- Initial vocabulary is intentionally coarse where the source is coarse.
insert into public.muscle_groups(slug, name) values
  ('chest', 'Chest'), ('back', 'Back'), ('upper_back', 'Upper back'),
  ('abdominals', 'Abdominals'), ('quadriceps', 'Quadriceps'), ('calves', 'Calves'),
  ('glutes', 'Glutes'), ('hamstrings', 'Hamstrings'), ('hip_adductors', 'Hip adductors'),
  ('hip_abductors', 'Hip abductors'), ('triceps', 'Triceps'), ('biceps', 'Biceps'),
  ('deltoids', 'Deltoids'), ('forearms', 'Forearms'), ('hip_flexors', 'Hip flexors'),
  ('obliques', 'Obliques'), ('rotator_cuff', 'Rotator cuff'), ('rhomboids', 'Rhomboids'),
  ('wrist_flexors', 'Wrist flexors'), ('wrist_extensors', 'Wrist extensors');
insert into public.muscles(slug, name) values
  ('pectoralis_major', 'Pectoralis major'), ('latissimus_dorsi', 'Latissimus dorsi'),
  ('rectus_femoris', 'Rectus femoris'), ('trapezius', 'Trapezius'),
  ('serratus_anterior', 'Serratus anterior'), ('levator_scapulae', 'Levator scapulae'),
  ('soleus', 'Soleus'), ('brachialis', 'Brachialis'), ('sternocleidomastoid', 'Sternocleidomastoid');
insert into public.muscle_group_members(muscle_group_id, muscle_id)
  select g.id, m.id from (values
    ('chest', 'pectoralis_major'), ('back', 'latissimus_dorsi'), ('quadriceps', 'rectus_femoris'),
    ('upper_back', 'trapezius'), ('upper_back', 'levator_scapulae'), ('calves', 'soleus')
  ) v(group_slug, muscle_slug)
  join public.muscle_groups g on g.slug = v.group_slug join public.muscles m on m.slug = v.muscle_slug;
insert into public.exercise_families(slug, name) values ('bench_press', 'Bench press');

-- Shared taxonomy is curated by trusted tooling. Private exercise classifications
-- follow the same visibility as their exercise. All revision writes use the RPC.
do $$ declare t text; begin
  foreach t in array array['muscle_groups','muscles','muscle_group_members','exercise_families',
    'exercise_analysis_revisions','exercise_muscle_mappings'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated, service_role', t);
    execute format('grant select on public.%I to authenticated, service_role', t);
  end loop;
  foreach t in array array['muscle_groups','muscles','muscle_group_members','exercise_families'] loop
    execute format('grant insert, update, delete on public.%I to service_role', t);
    execute format('create policy taxonomy_read on public.%I for select to authenticated using (true)', t);
  end loop;
end; $$;
create policy analysis_read on public.exercise_analysis_revisions for select to authenticated
  using (private.can_read_exercise(exercise_id));
create policy mapping_read on public.exercise_muscle_mappings for select to authenticated
  using (exists(select 1 from public.exercise_analysis_revisions r where r.id = revision_id));

create function public.revise_exercise_analysis(exercise_id uuid, provenance text,
  source_reference text, mappings jsonb, family_id uuid default null, reviewed_by uuid default null)
returns public.exercise_analysis_revisions language plpgsql security definer set search_path = '' as $$
declare result public.exercise_analysis_revisions; e public.exercises; m jsonb; reviewer uuid;
begin
  select * into e from public.exercises x where x.id = exercise_id for update;
  if not found then raise exception 'Exercise not available' using errcode = '42501'; end if;
  if auth.role() = 'service_role' then
    reviewer = reviewed_by;
  else
    if not private.can_edit_exercise(exercise_id) or provenance <> 'coach_reviewed' then
      raise exception 'Only the owning coach can review a custom exercise' using errcode = '42501';
    end if;
    if reviewed_by is not null and reviewed_by <> auth.uid() then
      raise exception 'Cannot impersonate a reviewer' using errcode = '42501';
    end if;
    reviewer = auth.uid();
  end if;
  if reviewer is not null and not exists(select 1 from public.profiles p where p.id = reviewer and p.role = 'coach') then
    raise exception 'Reviewer must be a coach' using errcode = '23514';
  end if;
  if jsonb_typeof(mappings) is distinct from 'array' then
    raise exception 'Mappings must be an array' using errcode = '23514';
  end if;
  -- Recheck under the exercise lock: a long-running import may have read its
  -- revision inventory before a coach completed a review. Repeat imports are no-ops.
  if provenance = 'imported' then
    select * into result from public.exercise_analysis_revisions r
      where r.exercise_id = e.id order by r.revision desc limit 1;
    if found and (result.provenance = 'coach_reviewed' or
      (result.provenance = 'imported' and result.source_reference = revise_exercise_analysis.source_reference)) then
      return result;
    end if;
  end if;
  insert into public.exercise_analysis_revisions(exercise_id, revision, family_id, provenance, source_reference, reviewed_by)
    select e.id, coalesce(max(r.revision), 0) + 1, revise_exercise_analysis.family_id,
      revise_exercise_analysis.provenance, revise_exercise_analysis.source_reference, reviewer
    from public.exercise_analysis_revisions r where r.exercise_id = e.id returning * into result;
  for m in select value from jsonb_array_elements(mappings) loop
    insert into public.exercise_muscle_mappings(revision_id, muscle_group_id, muscle_id, role)
      values(result.id, (m->>'muscle_group_id')::uuid, (m->>'muscle_id')::uuid, m->>'role');
  end loop;
  return result;
end;
$$;
grant execute on function public.revise_exercise_analysis(uuid,text,text,jsonb,uuid,uuid) to authenticated, service_role;

-- Embed labels and memberships as well as IDs: taxonomy edits cannot rewrite a
-- historical interpretation. Missing classification is null, not zero involvement.
create function private.exercise_analysis_snapshot(eid uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select to_jsonb(r) || jsonb_build_object('family', (select to_jsonb(f) from public.exercise_families f where f.id = r.family_id),
    'mappings', coalesce((select jsonb_agg(to_jsonb(m) || jsonb_build_object(
      'muscle_group', (select to_jsonb(g) from public.muscle_groups g where g.id = m.muscle_group_id),
      'muscle', (select to_jsonb(mu) from public.muscles mu where mu.id = m.muscle_id),
      'groups', coalesce((select jsonb_agg(to_jsonb(g) order by g.slug) from public.muscle_group_members gm
        join public.muscle_groups g on g.id = gm.muscle_group_id where gm.muscle_id = m.muscle_id), '[]'::jsonb))
      order by m.id) from public.exercise_muscle_mappings m where m.revision_id = r.id), '[]'::jsonb))
  from public.exercise_analysis_revisions r where r.exercise_id = eid order by r.revision desc limit 1;
$$;
alter table public.proposed_exercises add column analysis_snapshot jsonb;
alter table public.workout_exercises add column actual_analysis_snapshot jsonb;
create function private.capture_exercise_analysis() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.exercise_id is not distinct from old.exercise_id then return new; end if;
  if tg_table_name = 'proposed_exercises' then
    new.analysis_snapshot = private.exercise_analysis_snapshot(new.exercise_id);
  else
    new.actual_analysis_snapshot = private.exercise_analysis_snapshot(new.exercise_id);
  end if;
  return new;
end;
$$;
create trigger capture_analysis before insert or update of exercise_id on public.proposed_exercises
  for each row execute function private.capture_exercise_analysis();
create trigger capture_analysis before insert or update of exercise_id on public.workout_exercises
  for each row execute function private.capture_exercise_analysis();

create type public.load_convention as enum (
  'unknown', 'total_external', 'per_dumbbell', 'added_bodyweight', 'assistance', 'machine_display', 'bodyweight'
);
alter table public.prescribed_sets
  add column load_convention public.load_convention not null default 'unknown',
  add column load_reference text,
  add check (load_convention <> 'bodyweight' or load_kg is null or load_kg = 0),
  add check (load_reference is null or (load_convention = 'machine_display' and length(trim(load_reference)) between 1 and 200));
alter table public.logged_sets
  add column load_convention public.load_convention not null default 'unknown',
  add column load_reference text,
  add check (load_convention <> 'bodyweight' or load_kg is null or load_kg = 0),
  add check (load_reference is null or (load_convention = 'machine_display' and length(trim(load_reference)) between 1 and 200));

create function private.validate_target_loads() returns trigger language plpgsql set search_path = '' as $$
declare t jsonb; convention public.load_convention;
begin
  for t in select value from jsonb_array_elements(new.targets) loop
    convention = coalesce(t->>'load_convention', 'unknown')::public.load_convention;
    if (convention = 'bodyweight' and (t->>'load_kg')::numeric <> 0)
      or (t->>'load_reference' is not null and (convention <> 'machine_display'
        or length(trim(t->>'load_reference')) not between 1 and 200)) then
      raise exception 'Invalid target load convention/reference' using errcode = '23514';
    end if;
  end loop;
  return new;
end;
$$;
create trigger validate_target_loads before insert or update of targets on public.proposed_exercises
  for each row execute function private.validate_target_loads();

create or replace function private.session_snapshot(sid uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare result jsonb; blocks jsonb;
begin
  if exists(select 1 from public.session_blocks b left join public.exercise_prescriptions e on e.block_id = b.id
    where b.session_id = sid group by b.id having (b.kind = 'single' and count(e.id) <> 1) or (b.kind = 'superset' and count(e.id) <> 2)) then
    raise exception 'A single block requires one exercise; a superset requires two' using errcode = '23514';
  end if;
  select coalesce(jsonb_agg(to_jsonb(b) || jsonb_build_object('exercises', (
    select jsonb_agg(jsonb_build_object('prescription_id', e.id, 'exercise_id', e.exercise_id,
      'display_name', e.display_name, 'notes', e.coach_notes, 'position', e.position, 'block_id', e.block_id,
      'analysis_snapshot', private.exercise_analysis_snapshot(e.exercise_id),
      'targets', coalesce((select jsonb_agg(jsonb_build_object('position', t.position, 'load_kg', t.load_kg,
        'load_convention', t.load_convention, 'load_reference', t.load_reference,
        'reps_min', t.reps_min, 'reps_max', t.reps_max, 'rir', t.rir, 'rest_seconds', t.rest_seconds, 'notes', t.notes)
        order by t.position) from public.prescribed_sets t where t.prescription_id = e.id), '[]'::jsonb)) order by e.position)
    from public.exercise_prescriptions e where e.block_id = b.id)) order by b.position), '[]'::jsonb)
    into blocks from public.session_blocks b where b.session_id = sid;
  select jsonb_build_object('session_id', s.id, 'name', s.name, 'notes', s.notes,
    'programme_id', p.id, 'programme_revision', p.revision, 'blocks', blocks,
    'exercises', coalesce((select jsonb_agg(e.value order by b.ordinality, e.ordinality)
      from jsonb_array_elements(blocks) with ordinality b
      cross join lateral jsonb_array_elements(b.value->'exercises') with ordinality e), '[]'::jsonb))
    into result from public.sessions s join public.programme_weeks w on w.id = s.week_id
      join public.programmes p on p.id = w.programme_id where s.id = sid;
  return result;
end;
$$;

-- Actual load semantics are supplied explicitly, never inferred from equipment
-- or copied from targets: the client may have substituted equipment while logging.
create or replace function public.save_workout(workout_id uuid, exercises jsonb, feedback jsonb default null, complete boolean default false)
returns public.workouts language plpgsql security definer set search_path = '' as $$
declare result public.workouts; e jsonb; st jsonb; eid uuid; target uuid;
begin
  select * into result from public.workouts w where w.id = workout_id and w.client_id = auth.uid() for update;
  if not found then raise exception 'Workout not available' using errcode = '42501'; end if;
  if result.status = 'completed' and complete then return result; end if;
  if result.status <> 'in_progress' then raise exception 'Workout is closed' using errcode = '23514'; end if;
  if jsonb_typeof(exercises) is distinct from 'array' then raise exception 'Exercises must be an array' using errcode = '23514'; end if;
  if exists(select 1 from jsonb_array_elements(exercises) x group by x->>'id' having count(*) > 1) then
    raise exception 'Duplicate exercise entries' using errcode = '23514';
  end if;
  for e in select value from jsonb_array_elements(exercises) loop
    eid = (e->>'id')::uuid;
    if not exists(select 1 from public.workout_exercises we where we.id = eid and we.workout_id = result.id) then
      raise exception 'Workout exercise not available' using errcode = '42501';
    end if;
    if e ? 'exercise_id' then
      target = (e->>'exercise_id')::uuid;
      if target is not null and not private.can_read_exercise(target) then raise exception 'Exercise not available' using errcode = '42501'; end if;
      update public.workout_exercises we set exercise_id = target where we.id = eid;
    end if;
    if e ? 'performed_name' then update public.workout_exercises we set performed_name = e->>'performed_name' where we.id = eid; end if;
    if jsonb_typeof(e->'sets') is distinct from 'array' then raise exception 'Sets must be an array' using errcode = '23514'; end if;
    delete from public.logged_sets ls where ls.workout_exercise_id = eid;
    for st in select value from jsonb_array_elements(e->'sets') loop
      insert into public.logged_sets(workout_exercise_id, position, load_kg, load_convention, load_reference, reps, rir, completed)
        values(eid, (st->>'position')::integer, (st->>'load_kg')::numeric,
          coalesce(st->>'load_convention', 'unknown')::public.load_convention, st->>'load_reference', (st->>'reps')::integer,
          (st->>'rir')::numeric, coalesce((st->>'completed')::boolean, false));
    end loop;
  end loop;
  if feedback is not null then
    if jsonb_typeof(feedback) <> 'object' then raise exception 'Feedback must be an object' using errcode = '23514'; end if;
    insert into public.workout_feedback(workout_id, energy, sleep_hours, pain_reported, pain_location, pain_severity, notes)
      values(workout_id, feedback->>'energy', (feedback->>'sleep_hours')::numeric, (feedback->>'pain_reported')::boolean,
        feedback->>'pain_location', (feedback->>'pain_severity')::integer, coalesce(feedback->>'notes',''))
      on conflict on constraint workout_feedback_pkey do update set energy = excluded.energy, sleep_hours = excluded.sleep_hours,
        pain_reported = excluded.pain_reported, pain_location = excluded.pain_location, pain_severity = excluded.pain_severity, notes = excluded.notes;
  end if;
  if complete then
    update public.workouts w set status = 'completed', completed_at = now() where w.id = workout_id returning * into result;
  end if;
  return result;
end;
$$;
