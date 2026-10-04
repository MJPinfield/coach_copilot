-- Trusted agent/backend entry point. A client cannot forge assistant-authored
-- proposals; application remains a separate client-authenticated start_workout.
create function public.create_adaptation_proposal(
  client_id uuid, session_ids uuid[], reason text, exercises jsonb, conversation_id uuid default null
) returns public.adaptation_proposals language plpgsql security definer set search_path = '' as $$
declare result public.adaptation_proposals; sid uuid; pid uuid; e jsonb; st jsonb; eid uuid; src text;
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
  for e in select value from jsonb_array_elements(exercises) loop
    if e->>'exercise_id' is not null and not exists(select 1 from public.exercises x
      where x.id = (e->>'exercise_id')::uuid and x.retired_at is null and (x.owner_coach_id is null or
        exists(select 1 from public.coach_clients c where c.coach_id = x.owner_coach_id
          and c.client_id = create_adaptation_proposal.client_id and c.status = 'active'))) then
      raise exception 'Exercise not available to client' using errcode = '42501';
    end if;
    if jsonb_typeof(e->'targets') is distinct from 'array' or jsonb_typeof(e->'source_prescription_ids') is distinct from 'array' then
      raise exception 'Targets and source_prescription_ids must be arrays' using errcode = '23514';
    end if;
    for st in select value from jsonb_array_elements(e->'targets') loop
      if coalesce((st->>'position')::integer, 0) <= 0
        or (st->>'load_kg')::numeric < 0 or (st->>'load_kg')::numeric >= 'Infinity'::numeric
        or (st->>'reps_min')::integer <= 0
        or (st->>'reps_max')::integer < (st->>'reps_min')::integer
        or (st->>'reps_max' is not null and st->>'reps_min' is null)
        or (st->>'rir')::numeric not between 0 and 10 then
        raise exception 'Invalid target values' using errcode = '23514';
      end if;
    end loop;
    if exists(select 1 from jsonb_array_elements(e->'targets') t group by t->>'position' having count(*) > 1) then
      raise exception 'Duplicate target positions' using errcode = '23514';
    end if;
    insert into public.proposed_exercises(proposal_id, exercise_id, position, display_name, notes, targets)
      values(result.id, (e->>'exercise_id')::uuid, (e->>'position')::integer, e->>'display_name', coalesce(e->>'notes',''), e->'targets') returning id into eid;
    for src in select jsonb_array_elements_text(e->'source_prescription_ids') loop
      if not exists(select 1 from public.exercise_prescriptions p where p.id = src::uuid and p.session_id = any(session_ids)) then
        raise exception 'Source prescription is outside proposed sessions' using errcode = '23514';
      end if;
      insert into public.proposal_exercise_sources values(eid, src::uuid);
    end loop;
  end loop;
  return result;
end;
$$;
revoke all on function public.create_adaptation_proposal(uuid,uuid[],text,jsonb,uuid) from public, anon, authenticated;
grant execute on function public.create_adaptation_proposal(uuid,uuid[],text,jsonb,uuid) to service_role;

create function public.add_workout_exercise(workout_id uuid, exercise_id uuid, display_name text)
returns public.workout_exercises language plpgsql security definer set search_path = '' as $$
declare result public.workout_exercises; next_position integer;
begin
  perform 1 from public.workouts w where w.id = workout_id and w.client_id = auth.uid() and w.status = 'in_progress' for update;
  if not found then raise exception 'Open workout not available' using errcode = '42501'; end if;
  if exercise_id is not null and not private.can_read_exercise(exercise_id) then raise exception 'Exercise not available' using errcode = '42501'; end if;
  select coalesce(max(e.position), 0) + 1 into next_position from public.workout_exercises e where e.workout_id = add_workout_exercise.workout_id;
  insert into public.workout_exercises(workout_id, exercise_id, position, performed_name, applied_snapshot)
    values(workout_id, exercise_id, next_position, display_name, jsonb_build_object('extra', true)) returning * into result;
  return result;
end;
$$;
revoke all on function public.add_workout_exercise(uuid,uuid,text) from public, anon;
grant execute on function public.add_workout_exercise(uuid,uuid,text) to authenticated;
