begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

select results_eq(
  $$select tablename::text collate "C" from pg_tables where schemaname = 'public' order by tablename$$,
  $$select unnest(array['adaptation_proposals','coach_clients','conversations','exercise_analysis_revisions','exercise_families','exercise_instructions','exercise_media','exercise_muscle_mappings',
    'exercise_prescriptions','exercises','logged_sets','messages','muscle_group_members','muscle_groups','muscles','prescribed_sets','profiles','programme_weeks',
    'programmes','proposal_exercise_sources','proposal_sessions','proposed_blocks','proposed_exercises','session_blocks','sessions','workout_blocks','workout_exercise_sources',
    'workout_exercises','workout_feedback','workout_sources','workouts']) collate "C"$$,
  'Every domain table is explicitly inventoried by the HTTP role matrix');

select ok(rowsecurity, tablename || ': RLS enabled') from pg_tables where schemaname = 'public';
select ok(not has_table_privilege('anon', 'public.' || tablename, privilege), tablename || ': anon denied ' || privilege)
from pg_tables cross join unnest(array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) privilege where schemaname = 'public';
select is(has_table_privilege('service_role', 'public.' || tablename, privilege),
  privilege = 'SELECT' or tablename not in ('exercise_analysis_revisions','exercise_muscle_mappings'), tablename || ': trusted service ' || privilege)
from pg_tables cross join unnest(array['SELECT','INSERT','UPDATE','DELETE']) privilege where schemaname = 'public';
select ok(not has_table_privilege('authenticated', 'public.' || tablename, privilege), tablename || ': API denied ' || privilege)
from pg_tables cross join unnest(array['TRUNCATE','REFERENCES','TRIGGER']) privilege where schemaname = 'public';
select ok(has_table_privilege('authenticated', 'public.' || tablename, 'SELECT'), tablename || ': authenticated SELECT subject to RLS')
from pg_tables where schemaname = 'public';

select is(has_table_privilege('authenticated', 'public.' || tablename, 'INSERT'),
  tablename = any(array['exercises','exercise_instructions','programmes','programme_weeks','sessions','session_blocks','exercise_prescriptions','prescribed_sets','conversations','messages']),
  tablename || ': INSERT allowlist') from pg_tables where schemaname = 'public';
select is(has_table_privilege('authenticated', 'public.' || tablename, 'UPDATE'),
  tablename = any(array['exercises','exercise_instructions','programmes','programme_weeks','sessions','session_blocks','exercise_prescriptions','prescribed_sets']),
  tablename || ': UPDATE allowlist') from pg_tables where schemaname = 'public';
select is(has_table_privilege('authenticated', 'public.' || tablename, 'DELETE'),
  tablename = any(array['exercises','exercise_instructions','programmes','programme_weeks','sessions','session_blocks','exercise_prescriptions','prescribed_sets','conversations']),
  tablename || ': DELETE allowlist') from pg_tables where schemaname = 'public';
select is(has_column_privilege('authenticated', 'public.profiles', column_name, 'UPDATE'), column_name = 'display_name', 'Profile column update: ' || column_name)
from information_schema.columns where table_schema = 'public' and table_name = 'profiles';

select ok(not has_function_privilege('anon', p.oid, 'EXECUTE'), n.nspname || '.' || p.proname || ': anon cannot execute')
from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname in ('public','private');
select results_eq(
  $$select p.proname::text collate "C" from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' order by p.proname$$,
  $$select unnest(array['abandon_workout','accept_invitation','add_workout_exercise','create_adaptation_proposal',
    'deactivate_relationship','reject_proposal','revise_exercise_analysis','save_workout','start_workout']) collate "C"$$,
  'Every exposed RPC is explicitly inventoried by the HTTP authorization tests');
select ok(coalesce(p.proconfig @> array['search_path=""'], false), n.nspname || '.' || p.proname || ': definer search path pinned')
from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname in ('public','private') and p.prosecdef;
select is(has_function_privilege('authenticated', p.oid, 'EXECUTE'), p.proname <> 'create_adaptation_proposal', p.proname || ': public RPC execute allowlist')
from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public';
select ok(not has_function_privilege('authenticated', p.oid, 'EXECUTE'), p.proname || ': trigger not callable')
from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'private' and p.prorettype = 'trigger'::regtype;
select ok(not has_schema_privilege('anon', 'private', 'USAGE'), 'Anonymous cannot use private schema');
select ok(not has_schema_privilege('authenticated', 'public', 'CREATE'), 'API cannot create exposed objects');

-- Prove migration defaults, not just the current objects, are fail-closed.
create table public.permission_probe(id integer);
create function public.permission_probe() returns integer language sql as $$select 1$$;
select ok(not has_table_privilege('anon', 'public.permission_probe', 'SELECT'), 'Future tables closed to anon');
select ok(not has_table_privilege('authenticated', 'public.permission_probe', 'SELECT'), 'Future tables closed to authenticated');
select ok(not has_function_privilege('anon', 'public.permission_probe()', 'EXECUTE'), 'Future functions closed to anon');
select ok(not has_function_privilege('authenticated', 'public.permission_probe()', 'EXECUTE'), 'Future functions closed to authenticated');
select * from finish();
rollback;
