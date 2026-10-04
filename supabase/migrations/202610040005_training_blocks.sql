-- A session contains ordered single-exercise or superset blocks. Set positions
-- are round numbers inside a superset; prescriptions and actuals stay separate.
create table public.session_blocks (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions on delete cascade,
  position integer not null check (position > 0),
  kind text not null check (kind in ('single', 'superset')),
  label text not null default '' check (length(label) <= 80),
  rest_after_round_seconds integer check (rest_after_round_seconds >= 0),
  unique (session_id, position), unique (session_id, id)
);
create table public.proposed_blocks (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.adaptation_proposals on delete cascade,
  position integer not null check (position > 0),
  kind text not null check (kind in ('single', 'superset')),
  label text not null default '' check (length(label) <= 80),
  rest_after_round_seconds integer check (rest_after_round_seconds >= 0),
  unique (proposal_id, position), unique (proposal_id, id)
);
create table public.workout_blocks (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts on delete cascade,
  position integer not null check (position > 0),
  kind text not null check (kind in ('single', 'superset')),
  label text not null default '' check (length(label) <= 80),
  rest_after_round_seconds integer check (rest_after_round_seconds >= 0),
  applied_snapshot jsonb not null check (jsonb_typeof(applied_snapshot) = 'object'),
  unique (workout_id, position), unique (workout_id, id)
);

-- Existing data had no grouping: migrate it faithfully as individual blocks.
insert into public.session_blocks(id, session_id, position, kind)
  select id, session_id, position, 'single' from public.exercise_prescriptions;
insert into public.proposed_blocks(id, proposal_id, position, kind)
  select id, proposal_id, position, 'single' from public.proposed_exercises;
insert into public.workout_blocks(id, workout_id, position, kind, applied_snapshot)
  select id, workout_id, position, 'single', jsonb_build_object('kind', 'single', 'legacy', true) from public.workout_exercises;

alter table public.exercise_prescriptions add column block_id uuid;
update public.exercise_prescriptions set block_id = id;
alter table public.exercise_prescriptions alter column block_id set not null;
alter table public.exercise_prescriptions add foreign key (session_id, block_id) references public.session_blocks(session_id, id) on delete cascade;
create index on public.exercise_prescriptions(block_id);
alter table public.proposed_exercises add column block_id uuid;
update public.proposed_exercises set block_id = id;
alter table public.proposed_exercises alter column block_id set not null;
alter table public.proposed_exercises add foreign key (proposal_id, block_id) references public.proposed_blocks(proposal_id, id) on delete cascade;
create index on public.proposed_exercises(block_id);
alter table public.workout_exercises add column block_id uuid;
update public.workout_exercises set block_id = id;
alter table public.workout_exercises alter column block_id set not null;
alter table public.workout_exercises add foreign key (workout_id, block_id) references public.workout_blocks(workout_id, id) on delete cascade;
create index on public.workout_exercises(block_id);

alter table public.session_blocks enable row level security;
alter table public.proposed_blocks enable row level security;
alter table public.workout_blocks enable row level security;
revoke all on public.session_blocks, public.proposed_blocks, public.workout_blocks from anon, authenticated;
grant select on public.session_blocks, public.proposed_blocks, public.workout_blocks to authenticated;
grant insert, update, delete on public.session_blocks to authenticated;
grant all on public.session_blocks, public.proposed_blocks, public.workout_blocks to service_role;
create policy session_blocks_read on public.session_blocks for select to authenticated
  using (private.can_read_programme(private.session_programme(session_id)));
create policy session_blocks_write on public.session_blocks for all to authenticated
  using (private.can_manage_programme(private.session_programme(session_id)))
  with check (private.can_manage_programme(private.session_programme(session_id)));
create policy proposed_blocks_read on public.proposed_blocks for select to authenticated using (private.owns_proposal(proposal_id));
create policy workout_blocks_read on public.workout_blocks for select to authenticated using (private.can_read_workout(workout_id));
create trigger immutable_block_parent before update on public.session_blocks for each row execute function private.immutable_parent('session_id');

create function private.touch_block_programme() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.programmes set revision = revision + 1
    where id = private.session_programme(case when tg_op = 'DELETE' then old.session_id else new.session_id end);
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;
create trigger touch_block_programme before insert or update or delete on public.session_blocks
for each row execute function private.touch_block_programme();

-- Incomplete blocks are allowed while authoring, but cannot become a workout.
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
      'targets', coalesce((select jsonb_agg(jsonb_build_object('position', t.position, 'load_kg', t.load_kg,
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

-- Optional explicit block definitions reference exercise positions, so creation is
-- atomic. Omitting blocks intentionally requests individual exercise blocks.
drop function public.create_adaptation_proposal(uuid,uuid[],text,jsonb,uuid);
create function public.create_adaptation_proposal(client_id uuid, session_ids uuid[], reason text,
  exercises jsonb, conversation_id uuid default null, blocks jsonb default null)
returns public.adaptation_proposals language plpgsql security definer set search_path = '' as $$
declare result public.adaptation_proposals; sid uuid; pid uuid; e jsonb; b jsonb; eid uuid; bid uuid; src text;
  mappings jsonb = '{}'; ep text;
begin
  if coalesce(cardinality(session_ids), 0) = 0 or cardinality(session_ids) > 7
    or cardinality(session_ids) <> (select count(distinct x) from unnest(session_ids) x) then
    raise exception 'Provide distinct source sessions (1 to 7)' using errcode = '23514';
  end if;
  if jsonb_typeof(exercises) is distinct from 'array' or jsonb_array_length(exercises) = 0 then
    raise exception 'Provide proposed exercises' using errcode = '23514';
  end if;
  for pid in select distinct private.session_programme(x) from unnest(session_ids) x order by 1 loop
    perform 1 from public.programmes p where p.id = pid for update;
  end loop;
  foreach sid in array session_ids loop
    if not exists(select 1 from public.programmes p join public.coach_clients c on c.id = p.relationship_id
      where p.id = private.session_programme(sid) and c.client_id = create_adaptation_proposal.client_id
      and c.status = 'active' and p.status = 'published') then
      raise exception 'Published session not available to client' using errcode = '42501';
    end if;
    perform private.session_snapshot(sid);
  end loop;
  if (select count(distinct p.relationship_id) from public.programmes p where p.id in
    (select private.session_programme(x) from unnest(session_ids) x)) <> 1 then
    raise exception 'Combine within one coaching relationship' using errcode = '23514';
  end if;
  insert into public.adaptation_proposals(client_id, conversation_id, reason)
    values(client_id, conversation_id, reason) returning * into result;
  foreach sid in array session_ids loop
    insert into public.proposal_sessions(proposal_id, session_id, programme_revision)
      select result.id, sid, p.revision from public.programmes p where p.id = private.session_programme(sid);
  end loop;
  if blocks is not null then
    if jsonb_typeof(blocks) is distinct from 'array' then raise exception 'Blocks must be an array' using errcode = '23514'; end if;
    for b in select value from jsonb_array_elements(blocks) loop
      if jsonb_typeof(b->'exercise_positions') is distinct from 'array' then raise exception 'Provide block exercise positions' using errcode = '23514'; end if;
      insert into public.proposed_blocks(proposal_id, position, kind, label, rest_after_round_seconds)
        values(result.id, (b->>'position')::integer, b->>'kind', coalesce(b->>'label',''),
          (b->>'rest_after_round_seconds')::integer) returning id into bid;
      for ep in select (value::text)::integer::text from jsonb_array_elements_text(b->'exercise_positions') loop
        if mappings ? ep then raise exception 'Exercise assigned to multiple blocks' using errcode = '23514'; end if;
        mappings = mappings || jsonb_build_object(ep, bid);
      end loop;
    end loop;
    if (select array_agg(key order by key) from jsonb_object_keys(mappings) key) is distinct from
      (select array_agg((value->>'position')::integer::text order by (value->>'position')::integer::text) from jsonb_array_elements(exercises)) then
      raise exception 'Each proposed exercise must belong to exactly one block' using errcode = '23514';
    end if;
  end if;
  for e in select value from jsonb_array_elements(exercises) loop
    if e->>'exercise_id' is not null and not exists(select 1 from public.exercises x
      where x.id = (e->>'exercise_id')::uuid and x.retired_at is null and (x.owner_coach_id is null or
        exists(select 1 from public.coach_clients c where c.coach_id = x.owner_coach_id
          and c.client_id = create_adaptation_proposal.client_id and c.status = 'active'))) then
      raise exception 'Exercise not available to client' using errcode = '42501';
    end if;
    if jsonb_typeof(e->'source_prescription_ids') is distinct from 'array' then raise exception 'Sources must be an array' using errcode = '23514'; end if;
    if blocks is null then
      insert into public.proposed_blocks(proposal_id, position, kind) values(result.id, (e->>'position')::integer, 'single') returning id into bid;
    else bid = (mappings->>((e->>'position')::integer::text))::uuid;
    end if;
    insert into public.proposed_exercises(proposal_id, block_id, exercise_id, position, display_name, notes, targets)
      values(result.id, bid, (e->>'exercise_id')::uuid, (e->>'position')::integer, e->>'display_name', coalesce(e->>'notes',''), e->'targets') returning id into eid;
    for src in select jsonb_array_elements_text(e->'source_prescription_ids') loop
      if not exists(select 1 from public.exercise_prescriptions p where p.id = src::uuid and p.session_id = any(session_ids)) then
        raise exception 'Source prescription is outside proposed sessions' using errcode = '23514';
      end if;
      insert into public.proposal_exercise_sources values(eid, src::uuid);
    end loop;
  end loop;
  if exists(select 1 from public.proposed_blocks b left join public.proposed_exercises e on e.block_id = b.id
    where b.proposal_id = result.id group by b.id having (b.kind = 'single' and count(e.id) <> 1) or (b.kind = 'superset' and count(e.id) <> 2)) then
    raise exception 'Invalid block exercise count' using errcode = '23514';
  end if;
  return result;
end;
$$;
revoke all on function public.create_adaptation_proposal(uuid,uuid[],text,jsonb,uuid,jsonb) from public, anon, authenticated;
grant execute on function public.create_adaptation_proposal(uuid,uuid[],text,jsonb,uuid,jsonb) to service_role;

create or replace function public.start_workout(workout_id uuid, session_ids uuid[], proposal_id uuid default null, readiness jsonb default '{}')
returns public.workouts language plpgsql security definer set search_path = '' as $$
declare result public.workouts; sid uuid; snapshot jsonb; original jsonb = '[]';
  e jsonb; t jsonb; b jsonb; eid uuid; bid uuid; pos integer = 0; block_pos integer = 0;
  proposal public.adaptation_proposals; programme_id uuid; applied jsonb = '[]';
begin
  if not private.is_client() or workout_id is null then raise exception 'Client access required' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(workout_id::text, 0));
  select * into result from public.workouts w where w.id = workout_id;
  if found then
    if result.client_id <> auth.uid() then raise exception 'Workout not available' using errcode = '42501'; end if;
    if result.proposal_id is distinct from proposal_id or result.readiness is distinct from readiness or
      (select array_agg(x order by x) from unnest(session_ids) x) is distinct from
      (select array_agg(s.session_id order by s.session_id) from public.workout_sources s where s.workout_id = result.id) then
      raise exception 'Workout ID already used for different inputs' using errcode = '23514';
    end if;
    return result;
  end if;
  if coalesce(cardinality(session_ids), 0) = 0 or cardinality(session_ids) > 7
    or cardinality(session_ids) <> (select count(distinct x) from unnest(session_ids) x) then
    raise exception 'Provide distinct source sessions (1 to 7)' using errcode = '23514';
  end if;
  if proposal_id is null and cardinality(session_ids) <> 1 then raise exception 'Combined sessions require an adaptation proposal' using errcode = '23514'; end if;
  for programme_id in select distinct private.session_programme(x) from unnest(session_ids) x order by 1 loop
    perform 1 from public.programmes p where p.id = programme_id for update;
  end loop;
  foreach sid in array session_ids loop
    if not exists(select 1 from public.programmes p join public.coach_clients c on c.id = p.relationship_id
      where p.id = private.session_programme(sid) and c.client_id = auth.uid() and c.status = 'active' and p.status = 'published') then
      raise exception 'Published session not available' using errcode = '42501';
    end if;
    snapshot = private.session_snapshot(sid);
    original = original || jsonb_build_array(snapshot);
    applied = applied || (snapshot->'blocks');
  end loop;
  if (select count(distinct p.relationship_id) from public.programmes p where p.id in
    (select private.session_programme(x) from unnest(session_ids) x)) <> 1 then
    raise exception 'Combined sessions must belong to one coaching relationship' using errcode = '23514';
  end if;
  if proposal_id is not null then
    select * into proposal from public.adaptation_proposals a where a.id = proposal_id and a.client_id = auth.uid() for update;
    if not found or proposal.status <> 'proposed' then raise exception 'Proposal not available' using errcode = '42501'; end if;
    if (select array_agg(s.session_id order by s.session_id) from public.proposal_sessions s where s.proposal_id = proposal.id)
      is distinct from (select array_agg(x order by x) from unnest(session_ids) x) then raise exception 'Proposal sources do not match' using errcode = '23514'; end if;
    if exists(select 1 from public.proposal_sessions s join public.programmes p on p.id = private.session_programme(s.session_id)
      where s.proposal_id = proposal.id and s.programme_revision <> p.revision) then
      raise exception 'Programme changed; request a new proposal' using errcode = '23514';
    end if;
    if not exists(select 1 from public.proposed_blocks b where b.proposal_id = proposal.id) or
      exists(select 1 from public.proposed_blocks b left join public.proposed_exercises e on e.block_id = b.id
        where b.proposal_id = proposal.id group by b.id having (b.kind = 'single' and count(e.id) <> 1) or (b.kind = 'superset' and count(e.id) <> 2)) then
      raise exception 'Invalid proposal blocks' using errcode = '23514';
    end if;
    select jsonb_agg(to_jsonb(pb) || jsonb_build_object('exercises', (
      select jsonb_agg(to_jsonb(pe) order by pe.position) from public.proposed_exercises pe where pe.block_id = pb.id)) order by pb.position)
      into applied from public.proposed_blocks pb where pb.proposal_id = proposal.id;
  end if;
  insert into public.workouts(id, client_id, proposal_id, readiness, adaptation_reason, applied_by, original_snapshot)
    values(workout_id, auth.uid(), proposal_id, readiness, proposal.reason, case when proposal_id is not null then auth.uid() end, original) returning * into result;
  foreach sid in array session_ids loop
    insert into public.workout_sources values(workout_id, sid, (private.session_snapshot(sid)->>'programme_revision')::bigint);
  end loop;
  for b in select value from jsonb_array_elements(applied) loop
    block_pos = block_pos + 1;
    insert into public.workout_blocks(workout_id, position, kind, label, rest_after_round_seconds, applied_snapshot)
      values(workout_id, block_pos, b->>'kind', b->>'label', (b->>'rest_after_round_seconds')::integer, b) returning id into bid;
    for e in select value from jsonb_array_elements(b->'exercises') loop
      if proposal_id is not null then
        if e->>'exercise_id' is not null and not private.can_read_exercise((e->>'exercise_id')::uuid) then raise exception 'Proposed exercise not available' using errcode = '42501'; end if;
        if exists(select 1 from public.proposal_exercise_sources ps join public.exercise_prescriptions ep on ep.id = ps.prescription_id
          where ps.proposed_exercise_id = (e->>'id')::uuid and not(ep.session_id = any(session_ids))) then
          raise exception 'Proposed exercise references another session' using errcode = '23514';
        end if;
      end if;
      pos = pos + 1;
      insert into public.workout_exercises(workout_id, block_id, exercise_id, position, performed_name, applied_snapshot)
        values(workout_id, bid, (e->>'exercise_id')::uuid, pos, e->>'display_name', e) returning id into eid;
      if proposal_id is null then insert into public.workout_exercise_sources values(eid, (e->>'prescription_id')::uuid);
      else insert into public.workout_exercise_sources select eid, s.prescription_id from public.proposal_exercise_sources s where s.proposed_exercise_id = (e->>'id')::uuid;
      end if;
      for t in select value from jsonb_array_elements(e->'targets') loop
        insert into public.logged_sets(workout_exercise_id, position) values(eid, (t->>'position')::integer);
      end loop;
    end loop;
  end loop;
  if proposal_id is not null then update public.adaptation_proposals a set status = 'applied' where a.id = proposal.id; end if;
  return result;
end;
$$;

create or replace function public.add_workout_exercise(workout_id uuid, exercise_id uuid, display_name text)
returns public.workout_exercises language plpgsql security definer set search_path = '' as $$
declare result public.workout_exercises; next_position integer; bid uuid;
begin
  perform 1 from public.workouts w where w.id = workout_id and w.client_id = auth.uid() and w.status = 'in_progress' for update;
  if not found then raise exception 'Open workout not available' using errcode = '42501'; end if;
  if exercise_id is not null and not private.can_read_exercise(exercise_id) then raise exception 'Exercise not available' using errcode = '42501'; end if;
  select coalesce(max(b.position), 0) + 1 into next_position from public.workout_blocks b where b.workout_id = add_workout_exercise.workout_id;
  insert into public.workout_blocks(workout_id, position, kind, applied_snapshot)
    values(workout_id, next_position, 'single', jsonb_build_object('extra', true)) returning id into bid;
  select coalesce(max(e.position), 0) + 1 into next_position from public.workout_exercises e where e.workout_id = add_workout_exercise.workout_id;
  insert into public.workout_exercises(workout_id, block_id, exercise_id, position, performed_name, applied_snapshot)
    values(workout_id, bid, exercise_id, next_position, display_name, jsonb_build_object('extra', true)) returning * into result;
  return result;
end;
$$;
