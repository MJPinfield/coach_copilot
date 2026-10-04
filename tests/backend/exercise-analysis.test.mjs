import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { clients, seed, fixture as f, password, checked } from '../../tooling/seed-backend.mjs';
import { catalogueAnalysis } from '../../tooling/catalogue-analysis.mjs';

const { admin, anonymous } = clients();
let coach, client, outsider, otherClient, groups, muscles, family;
const insert = async (sb, table, data) => checked(await sb.from(table).insert(data).select().single());
const custom = () => insert(coach, 'exercises', { source: 'custom', owner_coach_id: f.coach, name: 'Analysis fixture' });
const revise = (sb, id, overrides = {}) => sb.rpc('revise_exercise_analysis', {
  exercise_id: id, family_id: family.id, provenance: 'coach_reviewed', source_reference: 'Coach review fixture',
  mappings: [{ muscle_group_id: groups.chest, role: 'primary' }, { muscle_group_id: groups.triceps, role: 'secondary' }],
  ...overrides,
});
const revisions = async id => checked(await admin.from('exercise_analysis_revisions').select('*,exercise_muscle_mappings(*)').eq('exercise_id', id).order('revision'));
before(async () => {
  await seed();
  [coach, client, outsider, otherClient] = await Promise.all(['coach', 'client', 'othercoach', 'otherclient'].map(async name => {
    const sb = anonymous();
    checked(await sb.auth.signInWithPassword({ email: `${name}@example.test`, password }));
    return sb;
  }));
  groups = Object.fromEntries(checked(await admin.from('muscle_groups').select()).map(x => [x.slug, x.id]));
  muscles = Object.fromEntries(checked(await admin.from('muscles').select()).map(x => [x.slug, x.id]));
  family = checked(await admin.from('exercise_families').select().eq('slug', 'bench_press').single());
});
async function plan(exerciseId) {
  const programme = await insert(coach, 'programmes', { relationship_id: f.relationship, name: 'Analysis plan', status: 'published' });
  const week = await insert(coach, 'programme_weeks', { programme_id: programme.id, position: 1, name: 'Week' });
  const session = await insert(coach, 'sessions', { week_id: week.id, position: 1, name: 'Session' });
  const block = await insert(coach, 'session_blocks', { session_id: session.id, position: 1, kind: 'single' });
  const prescription = await insert(coach, 'exercise_prescriptions', { session_id: session.id, block_id: block.id, exercise_id: exerciseId, position: 1, display_name: 'Bench' });
  const target = await insert(coach, 'prescribed_sets', { prescription_id: prescription.id, position: 1, reps_min: 8, load_kg: 30, load_convention: 'per_dumbbell' });
  return { session, prescription, target };
}
const start = async (p, overrides = {}) => checked(await client.rpc('start_workout', { workout_id: randomUUID(), session_ids: [p.session.id], ...overrides }));
const occurrence = async id => checked(await client.from('workout_exercises').select('*,logged_sets(*)').eq('workout_id', id).single());

test('taxonomy and private revision visibility; all direct revision writes denied, including service role', async () => {
  const e = await custom();
  const r = checked(await revise(coach, e.id));
  const mapping = (await revisions(e.id))[0].exercise_muscle_mappings[0];
  const shared = ['muscle_groups', 'muscles', 'muscle_group_members', 'exercise_families'];
  for (const table of [...shared, 'exercise_analysis_revisions', 'exercise_muscle_mappings']) {
    assert.equal((await anonymous().from(table).select()).error?.code, '42501');
    for (const sb of [coach, client, outsider, otherClient]) {
      assert.equal((await sb.from(table).insert({})).error?.code, '42501');
      assert.equal((await sb.from(table).update(table === 'muscle_group_members' ? { muscle_id: muscles.soleus } : { id: randomUUID() }).not(table === 'muscle_group_members' ? 'muscle_id' : 'id', 'is', null)).error?.code, '42501');
      assert.equal((await sb.from(table).delete().not(table === 'muscle_group_members' ? 'muscle_id' : 'id', 'is', null)).error?.code, '42501');
      if (shared.includes(table)) assert.ok(checked(await sb.from(table).select()).length > 0);
    }
  }
  for (const [table, id] of [['exercise_analysis_revisions', r.id], ['exercise_muscle_mappings', mapping.id]]) {
    for (const sb of [coach, client]) assert.equal(checked(await sb.from(table).select().eq('id', id)).length, 1);
    for (const sb of [outsider, otherClient]) assert.deepEqual(checked(await sb.from(table).select().eq('id', id)), []);
    assert.equal((await admin.from(table).update({ id: randomUUID() }).eq('id', id)).error?.code, '42501');
    assert.equal((await admin.from(table).delete().eq('id', id)).error?.code, '42501');
    assert.equal((await admin.from(table).insert({})).error?.code, '42501');
  }
  for (const sb of [anonymous(), client, outsider, otherClient]) assert.equal((await revise(sb, e.id)).error?.code, '42501');
  assert.equal((await revise(coach, f.exercise)).error?.code, '42501');
  assert.equal((await revise(coach, e.id, { reviewed_by: f.otherCoach })).error?.code, '42501');
  assert.equal((await revise(coach, e.id, { provenance: 'imported' })).error?.code, '42501');
  try {
    for (const status of ['invited', 'inactive']) {
      checked(await admin.from('coach_clients').update({ status }).eq('id', f.relationship));
      assert.deepEqual(checked(await client.from('exercise_analysis_revisions').select().eq('id', r.id)), []);
      assert.deepEqual(checked(await client.from('exercise_muscle_mappings').select().eq('id', mapping.id)), []);
    }
  } finally {
    checked(await admin.from('coach_clients').update({ status: 'active' }).eq('id', f.relationship));
  }
});

test('mapping constraints roll back the whole revision; concurrent reviews produce distinct ordered revisions', async () => {
  const e = await custom();
  for (const mappings of [null, {}, [{ role: 'primary' }],
    [{ muscle_id: muscles.soleus, muscle_group_id: groups.calves, role: 'primary' }],
    [{ muscle_group_id: groups.chest, role: 'invented' }],
    [{ muscle_group_id: randomUUID(), role: 'primary' }],
    [{ muscle_group_id: groups.chest, role: 'primary' }, { muscle_group_id: groups.chest, role: 'secondary' }],
  ]) {
    assert.ok((await revise(coach, e.id, { mappings })).error);
    assert.deepEqual(await revisions(e.id), []);
  }
  assert.ok((await revise(admin, e.id, { reviewed_by: f.client })).error);
  assert.ok((await revise(admin, e.id, { provenance: 'imported', reviewed_by: f.coach })).error);
  const results = await Promise.all([revise(coach, e.id), revise(coach, e.id)]);
  assert.deepEqual(results.map(x => checked(x).revision).sort(), [1, 2]);
  const cleared = checked(await revise(coach, e.id, { family_id: undefined, mappings: [] }));
  assert.equal(cleared.revision, 3);
  assert.equal(cleared.family_id, null);
  assert.equal((await revisions(e.id)).length, 3);
});

test('original/applied/actual history preserves classification revisions and load targets; substitutions capture a new identity', async () => {
  const a = await custom();
  const b = await custom();
  const r1 = checked(await revise(coach, a.id, { mappings: [{ muscle_id: muscles.pectoralis_major, role: 'primary' }] }));
  const p = await plan(a.id);
  const w = await start(p);
  const original = w.original_snapshot[0].exercises[0];
  assert.equal(original.analysis_snapshot.id, r1.id);
  assert.equal(original.analysis_snapshot.mappings[0].groups[0].slug, 'chest');
  assert.equal(original.targets[0].load_convention, 'per_dumbbell');
  const e = await occurrence(w.id);
  assert.equal(e.applied_snapshot.analysis_snapshot.id, r1.id);
  assert.equal(e.actual_analysis_snapshot.id, r1.id);
  assert.equal(e.logged_sets[0].load_convention, 'unknown');
  checked(await revise(coach, a.id, { family_id: null, mappings: [] }));
  assert.equal((await occurrence(w.id)).actual_analysis_snapshot.id, r1.id);
  const rB = checked(await revise(coach, b.id));
  checked(await client.rpc('save_workout', { workout_id: w.id, exercises: [{ id: e.id, exercise_id: b.id, sets: [
    { position: 1, load_kg: 60, load_convention: 'total_external', reps: 8, completed: true },
  ] }] }));
  const saved = await occurrence(w.id);
  assert.equal(saved.actual_analysis_snapshot.id, rB.id);
  assert.equal(saved.applied_snapshot.analysis_snapshot.id, r1.id);
  assert.equal(saved.logged_sets[0].load_convention, 'total_external');
  checked(await client.rpc('save_workout', { workout_id: w.id, exercises: [{ id: e.id, exercise_id: null, sets: [] }] }));
  assert.equal((await occurrence(w.id)).actual_analysis_snapshot, null);
  const extra = checked(await client.rpc('add_workout_exercise', { workout_id: w.id, exercise_id: b.id, display_name: 'Extra' }));
  assert.equal(extra.actual_analysis_snapshot.id, rB.id);
});

test('proposal analysis freezes when proposed; original plan and actual performance retain their own interpretations', async () => {
  const e = await custom();
  const r1 = checked(await revise(coach, e.id));
  const p = await plan(e.id);
  const args = {
    client_id: f.client, session_ids: [p.session.id], reason: 'Try machine',
    exercises: [{ exercise_id: e.id, position: 1, display_name: 'Machine press', source_prescription_ids: [p.prescription.id],
      targets: [{ position: 1, load_kg: 40, load_convention: 'machine_display', load_reference: 'gym-a:chest-press-1' }] }],
  };
  const proposal = checked(await admin.rpc('create_adaptation_proposal', args));
  const r2 = checked(await revise(coach, e.id, { mappings: [] }));
  const w = await start(p, { proposal_id: proposal.id });
  const actual = await occurrence(w.id);
  assert.equal(actual.applied_snapshot.analysis_snapshot.id, r1.id);
  assert.equal(w.original_snapshot[0].exercises[0].analysis_snapshot.id, r2.id);
  assert.equal(actual.actual_analysis_snapshot.id, r2.id);
  assert.equal(actual.applied_snapshot.targets[0].load_reference, 'gym-a:chest-press-1');
  for (const target of [
    { load_convention: 'invalid' }, { load_convention: 'bodyweight', load_kg: 10 },
    { load_convention: 'total_external', load_reference: 'machine' }, { load_convention: 'machine_display', load_reference: ' ' },
  ]) {
    const reason = randomUUID();
    assert.ok((await admin.rpc('create_adaptation_proposal', { ...args, reason,
      exercises: [{ ...args.exercises[0], targets: [{ position: 1, ...target }] }],
    })).error);
    assert.deepEqual(checked(await admin.from('adaptation_proposals').select().eq('reason', reason)), []);
  }
});

test('taxonomy edits cannot rewrite captured labels/memberships; referenced records cannot be deleted', async () => {
  const group = await insert(admin, 'muscle_groups', { slug: `fixture_${randomUUID().replaceAll('-', '')}`, name: 'Original group' });
  const muscle = await insert(admin, 'muscles', { slug: `fixture_${randomUUID().replaceAll('-', '')}`, name: 'Original muscle' });
  checked(await admin.from('muscle_group_members').insert({ muscle_group_id: group.id, muscle_id: muscle.id }));
  const e = await custom();
  checked(await revise(coach, e.id, { mappings: [{ muscle_id: muscle.id, role: 'stabiliser' }] }));
  const p = await plan(e.id);
  const w = await start(p);
  const snapshot = (await occurrence(w.id)).actual_analysis_snapshot;
  checked(await admin.from('muscles').update({ name: 'Revised muscle' }).eq('id', muscle.id));
  checked(await admin.from('muscle_groups').update({ name: 'Revised group' }).eq('id', group.id));
  checked(await admin.from('muscle_group_members').delete().eq('muscle_id', muscle.id));
  assert.deepEqual((await occurrence(w.id)).actual_analysis_snapshot, snapshot);
  assert.equal(snapshot.mappings[0].groups[0].name, 'Original group');
  assert.equal(snapshot.mappings[0].muscle.name, 'Original muscle');
  assert.equal((await admin.from('muscles').delete().eq('id', muscle.id)).error?.code, '23503');
  assert.equal((await coach.from('exercises').delete().eq('id', e.id)).error?.code, '23503');
  const next = await occurrence((await start(p)).id);
  assert.equal(next.actual_analysis_snapshot.mappings[0].muscle.name, 'Revised muscle');
  assert.deepEqual(next.actual_analysis_snapshot.mappings[0].groups, []);
});

test('load conventions round-trip, omitted semantics remain unknown, invalid saves roll back and respect ownership', async () => {
  const p = await plan(f.exercise);
  const w = await start(p);
  const e = await occurrence(w.id);
  const conventions = ['unknown', 'total_external', 'per_dumbbell', 'added_bodyweight', 'assistance', 'machine_display', 'bodyweight'];
  const sets = conventions.map((load_convention, i) => ({ position: i + 1, load_convention,
    load_kg: load_convention === 'bodyweight' ? 0 : 30, reps: 8, completed: true,
    ...(load_convention === 'machine_display' ? { load_reference: 'gym-a:press-1' } : {}),
  }));
  checked(await client.rpc('save_workout', { workout_id: w.id, exercises: [{ id: e.id, sets }] }));
  const before = await occurrence(w.id);
  assert.deepEqual(before.logged_sets.sort((a, b) => a.position - b.position).map(x => x.load_convention), conventions);
  for (const invalid of [{ load_convention: 'nope' }, { load_convention: 'bodyweight', load_kg: 5 },
    { load_convention: 'unknown', load_reference: 'machine' }, { load_convention: 'machine_display', load_reference: ' ' }]) {
    assert.ok((await client.rpc('save_workout', { workout_id: w.id, exercises: [{ id: e.id, sets: [{ position: 1, ...invalid }] }] })).error);
    assert.deepEqual((await occurrence(w.id)).logged_sets.sort((a, b) => a.position - b.position), before.logged_sets);
    assert.ok((await coach.from('prescribed_sets').update(invalid).eq('id', p.target.id)).error);
  }
  assert.equal((await outsider.rpc('save_workout', { workout_id: w.id, exercises: [{ id: e.id, sets }] })).error?.code, '42501');
  checked(await client.rpc('save_workout', { workout_id: w.id, exercises: [{ id: e.id, sets: [{ position: 1, load_kg: 20 }] }] }));
  assert.equal((await occurrence(w.id)).logged_sets[0].load_convention, 'unknown');
});

test('catalogue import maps exact labels/IDs, is repeatable, retains raw metadata and never replaces a coach review', async () => {
  const e = await insert(admin, 'exercises', { source: 'synthetic', external_id: randomUUID(), name: 'Import fixture', target: 'pectorals', muscle_group: 'triceps' });
  const reference = `fixture@${randomUUID()}/v1`;
  const record = { id: '0025', target: 'pectorals', secondary_muscles: ['triceps', 'shoulders', 'triceps'] };
  const importer = await catalogueAnalysis(admin, checked, reference);
  await importer.import(e.id, record);
  let rows = await revisions(e.id);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].family_id, family.id);
  assert.equal(rows[0].provenance, 'imported');
  assert.equal(rows[0].exercise_muscle_mappings.length, 2);
  assert.ok(importer.unresolved.has('shoulders'));
  assert.equal(rows[0].exercise_muscle_mappings.find(x => x.muscle_group_id === groups.chest).role, 'primary');
  await (await catalogueAnalysis(admin, checked, reference)).import(e.id, record);
  assert.equal((await revisions(e.id)).length, 1);
  const raw = checked(await admin.from('exercises').select().eq('id', e.id).single());
  assert.equal(raw.target, 'pectorals');
  assert.equal(raw.muscle_group, 'triceps');
  const staleImporter = await catalogueAnalysis(admin, checked, `${reference}/v2`);
  checked(await revise(admin, e.id, { reviewed_by: f.coach, family_id: null, mappings: [{ muscle_group_id: groups.chest, role: 'primary' }] }));
  await staleImporter.import(e.id, record);
  rows = await revisions(e.id);
  assert.equal(rows.length, 2);
  assert.equal(rows[1].provenance, 'coach_reviewed');
  const unmapped = await custom();
  await importer.import(unmapped.id, { id: 'unknown', name: 'bench press', target: 'spine', secondary_muscles: ['feet'] });
  assert.deepEqual(await revisions(unmapped.id), []);
});
