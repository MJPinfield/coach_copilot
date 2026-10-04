-- Fresh baseline. Public tables are the PostgREST API; private helpers are not exposed.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null default '' check (length(display_name) <= 200),
  role text not null default 'client' check (role in ('coach', 'client')),
  created_at timestamptz not null default now()
);

create function private.create_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- User-editable auth metadata must never provision a coach role.
  insert into public.profiles(id, display_name)
  values (new.id, left(coalesce(new.raw_user_meta_data->>'display_name', ''), 200));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function private.create_profile();

create table public.coach_clients (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles,
  client_id uuid not null references public.profiles,
  status text not null default 'invited' check (status in ('invited', 'active', 'inactive')),
  created_at timestamptz not null default now(),
  unique (coach_id, client_id),
  check (coach_id <> client_id)
);
create index on public.coach_clients(client_id, status);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('hasaneyldrm/exercises-dataset', 'custom', 'synthetic')),
  external_id text,
  source_revision text,
  source_created_at timestamptz,
  owner_coach_id uuid references public.profiles,
  name text not null check (length(trim(name)) between 1 and 200),
  equipment text,
  body_part text,
  target text,
  muscle_group text,
  secondary_muscles text[] not null default '{}',
  retired_at timestamptz,
  unique (source, external_id),
  check ((source = 'custom' and owner_coach_id is not null and external_id is null)
    or (source <> 'custom' and owner_coach_id is null and external_id is not null))
);
create index on public.exercises(owner_coach_id);

create table public.exercise_instructions (
  exercise_id uuid not null references public.exercises,
  locale text not null check (length(locale) between 2 and 20),
  text text not null,
  steps text[] not null default '{}',
  source_revision text,
  primary key (exercise_id, locale)
);
create table public.exercise_media (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercises,
  kind text not null check (kind in ('thumbnail', 'animation')),
  source_media_id text,
  source_path text,
  source_revision text,
  asset_url text,
  width integer check (width > 0),
  height integer check (height > 0),
  attribution text not null,
  rights_reference text,
  unique (exercise_id, kind),
  check (asset_url is null or (asset_url like 'https://%' and length(trim(rights_reference)) > 0 and rights_reference is not null))
);

create table public.programmes (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.coach_clients,
  name text not null check (length(trim(name)) between 1 and 200),
  goal text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  revision bigint not null default 1 check (revision > 0),
  created_at timestamptz not null default now()
);
create index on public.programmes(relationship_id);
create table public.programme_weeks (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references public.programmes on delete cascade,
  position integer not null check (position > 0),
  name text not null check (length(trim(name)) between 1 and 200),
  notes text not null default '',
  unique (programme_id, position)
);
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.programme_weeks on delete cascade,
  position integer not null check (position > 0),
  name text not null check (length(trim(name)) between 1 and 200),
  notes text not null default '',
  unique (week_id, position)
);
create table public.exercise_prescriptions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions on delete cascade,
  exercise_id uuid references public.exercises,
  position integer not null check (position > 0),
  display_name text not null check (length(trim(display_name)) between 1 and 200),
  coach_notes text not null default '',
  unique (session_id, position)
);
create table public.prescribed_sets (
  id uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references public.exercise_prescriptions on delete cascade,
  position integer not null check (position > 0),
  load_kg numeric check (load_kg >= 0 and load_kg < 'Infinity'::numeric),
  reps_min integer check (reps_min > 0),
  reps_max integer check (reps_max >= reps_min and reps_min is not null),
  rir numeric check (rir between 0 and 10),
  rest_seconds integer check (rest_seconds >= 0),
  notes text not null default '',
  unique (prescription_id, position)
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles,
  title text not null default 'Training conversation',
  created_at timestamptz not null default now(),
  unique (id, client_id)
);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (length(trim(content)) between 1 and 20000),
  created_at timestamptz not null default now()
);
create index on public.messages(conversation_id, created_at);

create table public.adaptation_proposals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles,
  conversation_id uuid,
  reason text not null check (length(trim(reason)) > 0),
  status text not null default 'proposed' check (status in ('proposed', 'applied', 'rejected')),
  created_at timestamptz not null default now(),
  foreign key (conversation_id, client_id) references public.conversations(id, client_id)
);
create index on public.adaptation_proposals(client_id);
create table public.proposal_sessions (
  proposal_id uuid not null references public.adaptation_proposals on delete cascade,
  session_id uuid not null references public.sessions,
  programme_revision bigint not null check (programme_revision > 0),
  primary key (proposal_id, session_id)
);
create table public.proposed_exercises (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.adaptation_proposals on delete cascade,
  exercise_id uuid references public.exercises,
  position integer not null check (position > 0),
  display_name text not null check (length(trim(display_name)) between 1 and 200),
  notes text not null default '',
  targets jsonb not null check (jsonb_typeof(targets) = 'array'),
  unique (proposal_id, position)
);
create table public.proposal_exercise_sources (
  proposed_exercise_id uuid not null references public.proposed_exercises on delete cascade,
  prescription_id uuid not null references public.exercise_prescriptions,
  primary key (proposed_exercise_id, prescription_id)
);

create table public.workouts (
  id uuid primary key,
  client_id uuid not null references public.profiles,
  proposal_id uuid unique references public.adaptation_proposals,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  readiness jsonb not null default '{}' check (jsonb_typeof(readiness) = 'object'),
  adaptation_reason text,
  applied_by uuid references public.profiles,
  original_snapshot jsonb not null check (jsonb_typeof(original_snapshot) = 'array'),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  check ((status = 'completed') = (completed_at is not null))
);
create index on public.workouts(client_id, started_at);
create table public.workout_sources (
  workout_id uuid not null references public.workouts on delete cascade,
  session_id uuid not null references public.sessions,
  programme_revision bigint not null,
  primary key (workout_id, session_id)
);
create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts on delete cascade,
  exercise_id uuid references public.exercises,
  position integer not null check (position > 0),
  performed_name text not null check (length(trim(performed_name)) between 1 and 200),
  applied_snapshot jsonb not null check (jsonb_typeof(applied_snapshot) = 'object'),
  unique (workout_id, position)
);
create table public.workout_exercise_sources (
  workout_exercise_id uuid not null references public.workout_exercises on delete cascade,
  prescription_id uuid not null references public.exercise_prescriptions,
  primary key (workout_exercise_id, prescription_id)
);
create table public.logged_sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references public.workout_exercises on delete cascade,
  position integer not null check (position > 0),
  load_kg numeric check (load_kg >= 0 and load_kg < 'Infinity'::numeric),
  reps integer check (reps >= 0),
  rir numeric check (rir between 0 and 10),
  completed boolean not null default false,
  unique (workout_exercise_id, position)
);
create table public.workout_feedback (
  workout_id uuid primary key references public.workouts on delete cascade,
  energy text check (energy in ('low', 'normal', 'high')),
  sleep_hours numeric check (sleep_hours between 0 and 24),
  pain_reported boolean,
  pain_location text,
  pain_severity integer check (pain_severity between 0 and 10),
  notes text not null default ''
);

-- Security-definer helpers avoid recursive RLS. They expose only decisions for
-- the caller's own identity, never arbitrary-user impersonation parameters.
create function private.is_coach() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'coach');
$$;
create function private.is_client() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'client');
$$;
create function private.can_manage_programme(pid uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.programmes p join public.coach_clients c on c.id = p.relationship_id
    where p.id = pid and c.coach_id = auth.uid() and c.status in ('invited', 'active') and private.is_coach());
$$;
create function private.can_read_programme(pid uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.programmes p join public.coach_clients c on c.id = p.relationship_id
    where p.id = pid and (c.coach_id = auth.uid() or
      (c.client_id = auth.uid() and c.status = 'active' and p.status = 'published')));
$$;
create function private.session_programme(sid uuid) returns uuid language sql stable security definer set search_path = '' as $$
  select w.programme_id from public.sessions s join public.programme_weeks w on w.id = s.week_id where s.id = sid;
$$;
create function private.prescription_programme(eid uuid) returns uuid language sql stable security definer set search_path = '' as $$
  select private.session_programme(session_id) from public.exercise_prescriptions where id = eid;
$$;
create function private.can_read_exercise(eid uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.exercises e where e.id = eid and (e.owner_coach_id is null or e.owner_coach_id = auth.uid()
    or exists(select 1 from public.coach_clients c where c.coach_id = e.owner_coach_id and c.client_id = auth.uid() and c.status = 'active')));
$$;
create function private.can_edit_exercise(eid uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_coach() and exists(select 1 from public.exercises where id = eid and source = 'custom' and owner_coach_id = auth.uid());
$$;
create function private.owns_conversation(cid uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.conversations where id = cid and client_id = auth.uid());
$$;
create function private.owns_proposal(pid uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.adaptation_proposals where id = pid and client_id = auth.uid());
$$;
create function private.can_read_workout(wid uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.workouts w where w.id = wid and (w.client_id = auth.uid() or
    exists(select 1 from public.workout_sources s join public.sessions se on se.id = s.session_id
      join public.programme_weeks pw on pw.id = se.week_id join public.programmes p on p.id = pw.programme_id
      join public.coach_clients c on c.id = p.relationship_id
      where s.workout_id = w.id and c.coach_id = auth.uid() and c.client_id = w.client_id and c.status = 'active')));
$$;
create function private.exercise_workout(eid uuid) returns uuid language sql stable security definer set search_path = '' as $$
  select workout_id from public.workout_exercises where id = eid;
$$;

-- Explicit privileges: auth metadata cannot set roles; workout writes go through
-- transactional commands below, rather than separate browser table writes.
do $$ declare t text; begin
  foreach t in array array['profiles','coach_clients','exercises','exercise_instructions','exercise_media',
    'programmes','programme_weeks','sessions','exercise_prescriptions','prescribed_sets',
    'conversations','messages','adaptation_proposals','proposal_sessions','proposed_exercises','proposal_exercise_sources',
    'workouts','workout_sources','workout_exercises','workout_exercise_sources','logged_sets','workout_feedback'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;
grant update(display_name) on public.profiles to authenticated;
grant insert, update, delete on public.exercises, public.exercise_instructions,
  public.programmes, public.programme_weeks, public.sessions, public.exercise_prescriptions, public.prescribed_sets to authenticated;
grant insert, delete on public.conversations to authenticated;
grant insert on public.messages to authenticated;

create policy profiles_read on public.profiles for select to authenticated using (id = auth.uid() or exists(
  select 1 from public.coach_clients c where (c.coach_id = auth.uid() and c.client_id = profiles.id)
    or (c.client_id = auth.uid() and c.coach_id = profiles.id)));
create policy profiles_edit on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy relationships_read on public.coach_clients for select to authenticated using (coach_id = auth.uid() or client_id = auth.uid());
create policy exercises_read on public.exercises for select to authenticated using (owner_coach_id is null or owner_coach_id = auth.uid()
  or exists(select 1 from public.coach_clients c where c.coach_id = owner_coach_id and c.client_id = auth.uid() and c.status = 'active'));
create policy exercises_write on public.exercises for all to authenticated
  using (private.can_edit_exercise(id)) with check (private.is_coach() and source = 'custom' and owner_coach_id = auth.uid());
create policy instructions_read on public.exercise_instructions for select to authenticated using (private.can_read_exercise(exercise_id));
create policy instructions_write on public.exercise_instructions for all to authenticated
  using (private.can_edit_exercise(exercise_id)) with check (private.can_edit_exercise(exercise_id));
create policy media_read on public.exercise_media for select to authenticated using (private.can_read_exercise(exercise_id));
create policy programmes_read on public.programmes for select to authenticated using (exists(select 1 from public.coach_clients c
  where c.id = relationship_id and (c.coach_id = auth.uid() or (c.client_id = auth.uid() and c.status = 'active' and programmes.status = 'published'))));
create policy programmes_write on public.programmes for all to authenticated using (private.can_manage_programme(id))
  with check (private.is_coach() and exists(select 1 from public.coach_clients c
    where c.id = relationship_id and c.coach_id = auth.uid() and c.status in ('invited', 'active')));

create policy weeks_read on public.programme_weeks for select to authenticated using (private.can_read_programme(programme_id));
create policy weeks_write on public.programme_weeks for all to authenticated using (private.can_manage_programme(programme_id)) with check (private.can_manage_programme(programme_id));
create policy sessions_read on public.sessions for select to authenticated using (exists(select 1 from public.programme_weeks w
  where w.id = week_id and private.can_read_programme(w.programme_id)));
create policy sessions_write on public.sessions for all to authenticated
  using (private.can_manage_programme(private.session_programme(id)))
  with check (exists(select 1 from public.programme_weeks w where w.id = week_id and private.can_manage_programme(w.programme_id)));
create policy prescriptions_read on public.exercise_prescriptions for select to authenticated using (private.can_read_programme(private.session_programme(session_id)));
create policy prescriptions_write on public.exercise_prescriptions for all to authenticated
  using (private.can_manage_programme(private.session_programme(session_id)))
  with check (private.can_manage_programme(private.session_programme(session_id)) and (exercise_id is null or private.can_read_exercise(exercise_id)));
create policy sets_read on public.prescribed_sets for select to authenticated using (private.can_read_programme(private.prescription_programme(prescription_id)));
create policy sets_write on public.prescribed_sets for all to authenticated
  using (private.can_manage_programme(private.prescription_programme(prescription_id))) with check (private.can_manage_programme(private.prescription_programme(prescription_id)));

create policy conversations_own on public.conversations for all to authenticated using (client_id = auth.uid()) with check (client_id = auth.uid() and private.is_client());
create policy messages_read on public.messages for select to authenticated using (private.owns_conversation(conversation_id));
create policy messages_user_insert on public.messages for insert to authenticated with check (private.owns_conversation(conversation_id) and role = 'user');
create policy proposals_read on public.adaptation_proposals for select to authenticated using (client_id = auth.uid());
create policy proposal_sessions_read on public.proposal_sessions for select to authenticated using (private.owns_proposal(proposal_id));
create policy proposed_exercises_read on public.proposed_exercises for select to authenticated using (private.owns_proposal(proposal_id));
create policy proposal_sources_read on public.proposal_exercise_sources for select to authenticated using (
  exists(select 1 from public.proposed_exercises e where e.id = proposed_exercise_id and private.owns_proposal(e.proposal_id)));
create policy workouts_read on public.workouts for select to authenticated using (private.can_read_workout(id));
create policy workout_sources_read on public.workout_sources for select to authenticated using (private.can_read_workout(workout_id));
create policy workout_exercises_read on public.workout_exercises for select to authenticated using (private.can_read_workout(workout_id));
create policy workout_exercise_sources_read on public.workout_exercise_sources for select to authenticated using (private.can_read_workout(private.exercise_workout(workout_exercise_id)));
create policy logged_sets_read on public.logged_sets for select to authenticated using (private.can_read_workout(private.exercise_workout(workout_exercise_id)));
create policy feedback_read on public.workout_feedback for select to authenticated using (private.can_read_workout(workout_id));

revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated, service_role;
-- Trigger routines are never callable API operations.
revoke all on function private.create_profile() from authenticated;
