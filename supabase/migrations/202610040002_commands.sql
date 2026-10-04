create function private.validate_relationship() returns trigger language plpgsql set search_path = '' as $$
begin
  if not exists(select 1 from public.profiles where id = new.coach_id and role = 'coach')
    or not exists(select 1 from public.profiles where id = new.client_id and role = 'client') then
    raise exception 'A relationship requires a coach and a client' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger validate_relationship before insert or update on public.coach_clients
for each row execute function private.validate_relationship();

-- Keep ownership/provenance stable: editing a plan must never move old client
-- records to a different relationship or move a session between programmes.
create function private.immutable_parent() returns trigger language plpgsql set search_path = '' as $$
begin
  if to_jsonb(new)->'id' is distinct from to_jsonb(old)->'id'
    or to_jsonb(new)->tg_argv[0] is distinct from to_jsonb(old)->tg_argv[0] then
    raise exception 'Record identity and parent are immutable' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger immutable_programme_parent before update on public.programmes for each row execute function private.immutable_parent('relationship_id');
create trigger immutable_week_parent before update on public.programme_weeks for each row execute function private.immutable_parent('programme_id');
create trigger immutable_session_parent before update on public.sessions for each row execute function private.immutable_parent('week_id');
create trigger immutable_prescription_parent before update on public.exercise_prescriptions for each row execute function private.immutable_parent('session_id');
create trigger immutable_set_parent before update on public.prescribed_sets for each row execute function private.immutable_parent('prescription_id');

create function private.bump_revision() returns trigger language plpgsql set search_path = '' as $$
begin new.revision = old.revision + 1; return new; end;
$$;
create trigger bump_revision before update on public.programmes for each row execute function private.bump_revision();
create function private.touch_programme() returns trigger language plpgsql security definer set search_path = '' as $$
declare row_data jsonb; pid uuid;
begin
  row_data = case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  case tg_table_name
    when 'programme_weeks' then pid = (row_data->>'programme_id')::uuid;
    when 'sessions' then select programme_id into pid from public.programme_weeks where id = (row_data->>'week_id')::uuid;
    when 'exercise_prescriptions' then pid = private.session_programme((row_data->>'session_id')::uuid);
    when 'prescribed_sets' then pid = private.prescription_programme((row_data->>'prescription_id')::uuid);
  end case;
  update public.programmes set revision = revision + 1 where id = pid;
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;
create trigger touch_programme before insert or update or delete on public.programme_weeks for each row execute function private.touch_programme();
create trigger touch_programme before insert or update or delete on public.sessions for each row execute function private.touch_programme();
create trigger touch_programme before insert or update or delete on public.exercise_prescriptions for each row execute function private.touch_programme();
create trigger touch_programme before insert or update or delete on public.prescribed_sets for each row execute function private.touch_programme();

create function private.validate_exercise_selection() returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.exercise_id is not distinct from old.exercise_id then return new; end if;
  if new.exercise_id is not null and exists(select 1 from public.exercises where id = new.exercise_id and retired_at is not null) then
    raise exception 'Retired exercise cannot be newly prescribed' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger validate_exercise_selection before insert or update of exercise_id on public.exercise_prescriptions
for each row execute function private.validate_exercise_selection();

create function public.accept_invitation(relationship_id uuid) returns public.coach_clients
language plpgsql security definer set search_path = '' as $$
declare result public.coach_clients;
begin
  update public.coach_clients c set status = 'active'
    where c.id = relationship_id and c.client_id = auth.uid() and c.status in ('invited', 'active')
    returning c.* into result;
  if not found then raise exception 'Invitation not available' using errcode = '42501'; end if;
  return result;
end;
$$;
create function public.deactivate_relationship(relationship_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.coach_clients c set status = 'inactive' where c.id = relationship_id and c.coach_id = auth.uid();
  if not found then raise exception 'Relationship not available' using errcode = '42501'; end if;
end;
$$;

create function private.session_snapshot(sid uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('session_id', s.id, 'name', s.name, 'notes', s.notes,
    'programme_id', p.id, 'programme_revision', p.revision,
    'exercises', coalesce((select jsonb_agg(jsonb_build_object(
      'prescription_id', e.id, 'exercise_id', e.exercise_id, 'display_name', e.display_name,
      'notes', e.coach_notes, 'position', e.position,
      'targets', coalesce((select jsonb_agg(jsonb_build_object('position', t.position, 'load_kg', t.load_kg,
        'reps_min', t.reps_min, 'reps_max', t.reps_max, 'rir', t.rir, 'rest_seconds', t.rest_seconds, 'notes', t.notes)
        order by t.position) from public.prescribed_sets t where t.prescription_id = e.id), '[]'::jsonb)
    ) order by e.position) from public.exercise_prescriptions e where e.session_id = s.id), '[]'::jsonb))
  from public.sessions s join public.programme_weeks w on w.id = s.week_id
    join public.programmes p on p.id = w.programme_id where s.id = sid;
$$;

-- Client-generated workout_id makes retrying Start idempotent. Session snapshots
-- and all initial logged sets are created in the same database transaction.
create function public.start_workout(workout_id uuid, session_ids uuid[], proposal_id uuid default null, readiness jsonb default '{}')
returns public.workouts language plpgsql security definer set search_path = '' as $$
declare result public.workouts; sid uuid; snapshot jsonb; original jsonb = '[]';
  e jsonb; t jsonb; eid uuid; pos integer = 0; proposal public.adaptation_proposals;
  proposed public.proposed_exercises; programme_id uuid;
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
  if proposal_id is null and cardinality(session_ids) <> 1 then
    raise exception 'Combined sessions require an adaptation proposal' using errcode = '23514';
  end if;
  -- Match the coach editor's parent lock before checking revisions/snapshotting.
  for programme_id in select distinct private.session_programme(x) from unnest(session_ids) x order by 1 loop
    perform 1 from public.programmes p where p.id = programme_id for update;
  end loop;
  foreach sid in array session_ids loop
    if not exists(select 1 from public.sessions s join public.programme_weeks w on w.id = s.week_id
      join public.programmes p on p.id = w.programme_id join public.coach_clients c on c.id = p.relationship_id
      where s.id = sid and c.client_id = auth.uid() and c.status = 'active' and p.status = 'published') then
      raise exception 'Published session not available' using errcode = '42501';
    end if;
    snapshot = private.session_snapshot(sid);
    original = original || jsonb_build_array(snapshot);
  end loop;
  if (select count(distinct p.relationship_id) from public.programmes p where p.id in
    (select private.session_programme(x) from unnest(session_ids) x)) <> 1 then
    raise exception 'Combined sessions must belong to one coaching relationship' using errcode = '23514';
  end if;
  if proposal_id is not null then
    select * into proposal from public.adaptation_proposals a where a.id = proposal_id and a.client_id = auth.uid() for update;
    if not found or proposal.status <> 'proposed' then raise exception 'Proposal not available' using errcode = '42501'; end if;
    if (select array_agg(s.session_id order by s.session_id) from public.proposal_sessions s where s.proposal_id = proposal.id)
      is distinct from (select array_agg(x order by x) from unnest(session_ids) x) then
      raise exception 'Proposal sources do not match' using errcode = '23514';
    end if;
    if exists(select 1 from public.proposal_sessions s join public.programmes p on p.id = private.session_programme(s.session_id)
      where s.proposal_id = proposal.id and s.programme_revision <> p.revision) then
      raise exception 'Programme changed; request a new proposal' using errcode = '23514';
    end if;
    if not exists(select 1 from public.proposed_exercises e where e.proposal_id = proposal.id) then
      raise exception 'Proposal has no exercises' using errcode = '23514';
    end if;
  end if;
  insert into public.workouts(id, client_id, proposal_id, readiness, adaptation_reason, applied_by, original_snapshot)
    values (workout_id, auth.uid(), proposal_id, readiness, proposal.reason,
      case when proposal_id is not null then auth.uid() end, original) returning * into result;
  foreach sid in array session_ids loop
    insert into public.workout_sources values (workout_id, sid, (private.session_snapshot(sid)->>'programme_revision')::bigint);
  end loop;
  if proposal_id is null then
    for e in select value from jsonb_array_elements(original->0->'exercises') loop
      pos = pos + 1;
      insert into public.workout_exercises(workout_id, exercise_id, position, performed_name, applied_snapshot)
        values(workout_id, (e->>'exercise_id')::uuid, pos, e->>'display_name', e) returning id into eid;
      insert into public.workout_exercise_sources values(eid, (e->>'prescription_id')::uuid);
      for t in select value from jsonb_array_elements(e->'targets') loop
        insert into public.logged_sets(workout_exercise_id, position) values(eid, (t->>'position')::integer);
      end loop;
    end loop;
  else
    for proposed in select * from public.proposed_exercises e where e.proposal_id = proposal.id order by e.position loop
      if proposed.exercise_id is not null and not private.can_read_exercise(proposed.exercise_id) then
        raise exception 'Proposed exercise not available' using errcode = '42501';
      end if;
      if exists(select 1 from public.proposal_exercise_sources ps join public.exercise_prescriptions ep on ep.id = ps.prescription_id
        where ps.proposed_exercise_id = proposed.id and not(ep.session_id = any(session_ids))) then
        raise exception 'Proposed exercise references another session' using errcode = '23514';
      end if;
      insert into public.workout_exercises(workout_id, exercise_id, position, performed_name, applied_snapshot)
        values(workout_id, proposed.exercise_id, proposed.position, proposed.display_name, to_jsonb(proposed)) returning id into eid;
      insert into public.workout_exercise_sources select eid, s.prescription_id from public.proposal_exercise_sources s where s.proposed_exercise_id = proposed.id;
      for t in select value from jsonb_array_elements(proposed.targets) loop
        insert into public.logged_sets(workout_exercise_id, position) values(eid, (t->>'position')::integer);
      end loop;
    end loop;
    update public.adaptation_proposals a set status = 'applied' where a.id = proposal.id;
  end if;
  return result;
end;
$$;

-- Save draft values and/or finish atomically. Missing JSON values remain unknown,
-- not zero. Completion is an honest finished attempt, not proof of all targets met.
create function public.save_workout(workout_id uuid, exercises jsonb, feedback jsonb default null, complete boolean default false)
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
      insert into public.logged_sets(workout_exercise_id, position, load_kg, reps, rir, completed)
        values(eid, (st->>'position')::integer, (st->>'load_kg')::numeric, (st->>'reps')::integer,
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
create function public.abandon_workout(workout_id uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.workouts w set status = 'abandoned' where w.id = workout_id and w.client_id = auth.uid() and w.status = 'in_progress';
  if not found then raise exception 'Open workout not available' using errcode = '42501'; end if;
end;
$$;
create function public.reject_proposal(proposal_id uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.adaptation_proposals p set status = 'rejected' where p.id = proposal_id and p.client_id = auth.uid() and p.status = 'proposed';
  if not found then raise exception 'Proposal not available' using errcode = '42501'; end if;
end;
$$;

revoke all on all functions in schema private from public, anon, authenticated;
-- Only predicate helpers needed by RLS are executable by the API role.
grant execute on function private.is_coach(), private.is_client(), private.can_manage_programme(uuid),
  private.can_read_programme(uuid), private.session_programme(uuid), private.prescription_programme(uuid),
  private.can_read_exercise(uuid), private.can_edit_exercise(uuid), private.owns_conversation(uuid),
  private.owns_proposal(uuid), private.can_read_workout(uuid), private.exercise_workout(uuid) to authenticated;
revoke all on function public.accept_invitation(uuid), public.deactivate_relationship(uuid),
  public.start_workout(uuid, uuid[], uuid, jsonb), public.save_workout(uuid, jsonb, jsonb, boolean),
  public.abandon_workout(uuid), public.reject_proposal(uuid) from public, anon;
grant execute on function public.accept_invitation(uuid), public.deactivate_relationship(uuid),
  public.start_workout(uuid, uuid[], uuid, jsonb), public.save_workout(uuid, jsonb, jsonb, boolean),
  public.abandon_workout(uuid), public.reject_proposal(uuid) to authenticated;
