import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { clients, seed, fixture as f, password, checked } from '../../tooling/seed-backend.mjs';

const { admin, anonymous } = clients();
let coach, client;
const insert = async (table, data) => checked(await coach.from(table).insert(data).select().single());
before(async () => {
  await seed();
  [coach, client] = await Promise.all(['coach', 'client'].map(async name => {
    const sb = anonymous();
    checked(await sb.auth.signInWithPassword({ email: `${name}@example.test`, password }));
    return sb;
  }));
});
async function plan() {
  const p = await insert('programmes', { relationship_id: f.relationship, name: 'Superset plan', status: 'published' });
  const week = await insert('programme_weeks', { programme_id: p.id, position: 1, name: 'Week 1' });
  const session = await insert('sessions', { week_id: week.id, position: 1, name: 'Upper body' });
  const block = await insert('session_blocks', { session_id: session.id, kind: 'superset', position: 1, label: 'A', rest_after_round_seconds: 90 });
  const exercises = [];
  for (const [position, name] of [[1, 'Press'], [2, 'Row']]) {
    const e = await insert('exercise_prescriptions', { session_id: session.id, block_id: block.id, exercise_id: f.exercise, position, display_name: name });
    checked(await coach.from('prescribed_sets').insert([1, 2].map(round => ({ prescription_id: e.id, position: round, reps_min: position === 1 ? 6 : 10, load_kg: position === 1 ? 60 : 40 }))));
    exercises.push(e);
  }
  return { p, session, block, exercises };
}
const start = async (p, overrides = {}) => checked(await client.rpc('start_workout', { workout_id: randomUUID(), session_ids: [p.session.id], ...overrides }));
const blocks = async id => checked(await client.from('workout_blocks').select('*, workout_exercises(*, logged_sets(*))').eq('workout_id', id).order('position'));
const propose = async (p, overrides = {}) => admin.rpc('create_adaptation_proposal', {
  client_id: f.client, session_ids: [p.session.id], reason: 'Reduce load but retain the pair',
  exercises: p.exercises.map((e, i) => ({ exercise_id: f.exercise, position: i + 1, display_name: e.display_name,
    source_prescription_ids: [e.id], targets: [1, 2].map(position => ({ position, load_kg: 30, reps_min: 8 })) })),
  blocks: [{ position: 1, kind: 'superset', label: 'A', rest_after_round_seconds: 120, exercise_positions: [1, 2] }],
  ...overrides,
});

test('superset snapshots preserve A1/A2 order, per-exercise targets and one rest after the round', async () => {
  const p = await plan();
  const w = await start(p);
  const [b] = await blocks(w.id);
  assert.equal(b.kind, 'superset');
  assert.equal(b.rest_after_round_seconds, 90);
  assert.equal(b.workout_exercises.length, 2);
  const e = b.workout_exercises.sort((a, b) => a.position - b.position);
  assert.deepEqual(e.map(x => x.performed_name), ['Press', 'Row']);
  assert.deepEqual(e.map(x => x.applied_snapshot.targets[0].reps_min), [6, 10]);
  assert.deepEqual(e.map(x => x.logged_sets.map(s => s.position).sort()), [[1, 2], [1, 2]]);
  assert.equal(w.original_snapshot[0].blocks[0].rest_after_round_seconds, 90);
  assert.equal('rest_between_exercises' in b, false);
  assert.equal('rest_between_exercises' in b.applied_snapshot, false);
  checked(await coach.from('session_blocks').update({ label: 'Changed', rest_after_round_seconds: 180 }).eq('id', p.block.id));
  assert.equal((await blocks(w.id))[0].rest_after_round_seconds, 90);
  assert.equal((await blocks(w.id))[0].applied_snapshot.label, 'A');
  assert.equal((await client.from('workout_blocks').update({ rest_after_round_seconds: 0 }).eq('id', b.id)).error?.code, '42501');
});

test('superset logs belong to individual exercises; incomplete/unequal rounds do not invent performance', async () => {
  const p = await plan();
  const w = await start(p);
  const [b] = await blocks(w.id);
  const e = b.workout_exercises.sort((a, b) => a.position - b.position);
  checked(await client.rpc('save_workout', { workout_id: w.id, exercises: [
    { id: e[0].id, sets: [{ position: 1, reps: 6, load_kg: 60, completed: true }, { position: 2, reps: 5, load_kg: 60, completed: true }] },
    { id: e[1].id, sets: [{ position: 1, reps: 10, load_kg: 40, completed: true }] },
  ], complete: true }));
  const saved = (await blocks(w.id))[0].workout_exercises.sort((a, b) => a.position - b.position);
  assert.deepEqual(saved.map(x => x.logged_sets.length), [2, 1]);
  assert.deepEqual(saved.map(x => x.applied_snapshot.targets.length), [2, 2]);
  assert.equal(checked(await coach.from('workout_blocks').select().eq('id', b.id)).length, 1);
});

test('block ownership uses the session, and prescriptions cannot reference another session block', async () => {
  const a = await plan();
  const b = await plan();
  assert.equal((await coach.from('session_blocks').update({ session_id: b.session.id }).eq('id', a.block.id)).error?.code, '23514');
  assert.equal((await coach.from('exercise_prescriptions').update({ block_id: b.block.id }).eq('id', a.exercises[0].id)).error?.code, '23503');
  assert.equal((await client.from('session_blocks').insert({ session_id: a.session.id, position: 2, kind: 'superset' })).error?.code, '42501');
  assert.equal((await coach.from('session_blocks').delete().eq('id', a.block.id).select()).data.length, 1);
  assert.deepEqual(checked(await coach.from('exercise_prescriptions').select().eq('session_id', a.session.id)), []);
});

test('incomplete authoring blocks cannot start or become proposal sources', async () => {
  const p = await plan();
  checked(await coach.from('exercise_prescriptions').delete().eq('id', p.exercises[1].id));
  await assert.rejects(start(p), /superset requires two/);
  assert.equal((await propose(p)).error?.code, '23514');
  checked(await coach.from('session_blocks').update({ kind: 'single' }).eq('id', p.block.id));
  assert.equal((await start(p)).status, 'in_progress');
});

test('applied proposal grouping/rest and original prescription remain separate; regrouping invalidates stale proposals', async () => {
  const p = await plan();
  const a = checked(await propose(p));
  const w = await start(p, { proposal_id: a.id });
  assert.equal(w.original_snapshot[0].blocks[0].rest_after_round_seconds, 90);
  const [applied] = await blocks(w.id);
  assert.equal(applied.rest_after_round_seconds, 120);
  assert.deepEqual(applied.workout_exercises.map(e => e.applied_snapshot.targets[0].load_kg), [30, 30]);
  const stale = checked(await propose(p));
  checked(await coach.from('session_blocks').update({ rest_after_round_seconds: 60 }).eq('id', p.block.id));
  await assert.rejects(start(p, { proposal_id: stale.id }), /Programme changed/);
  assert.equal((await blocks(w.id))[0].rest_after_round_seconds, 120);
});

test('proposal block validation rejects incomplete, duplicate and unknown memberships atomically', async () => {
  const p = await plan();
  for (const definitions of [
    [], {}, [{ position: 1, kind: 'superset', exercise_positions: [1] }],
    [{ position: 1, kind: 'superset', exercise_positions: [1, 1, 2] }],
    [{ position: 1, kind: 'superset', exercise_positions: [1, 3] }],
    [{ position: 1, kind: 'single', exercise_positions: [1, 2] }],
    [{ position: 1, kind: 'superset', exercise_positions: [1, 2], rest_after_round_seconds: -1 }],
    [{ position: 1, kind: 'single', exercise_positions: [1] }, { position: 2, kind: 'single', exercise_positions: [1, 2] }],
  ]) {
    const reason = `invalid blocks ${randomUUID()}`;
    assert.ok((await propose(p, { reason, blocks: definitions })).error, JSON.stringify(definitions));
    assert.deepEqual(checked(await admin.from('adaptation_proposals').select().eq('reason', reason)), []);
  }
});

test('single/superset combinations use block order, not insertion order; extras remain standalone', async () => {
  const p = await plan();
  const first = await insert('session_blocks', { session_id: p.session.id, position: 2, kind: 'single', label: 'Warm up' });
  await insert('exercise_prescriptions', { session_id: p.session.id, block_id: first.id, exercise_id: f.exercise, position: 3, display_name: 'Warm up' });
  checked(await coach.from('session_blocks').update({ position: 3 }).eq('id', p.block.id));
  const w = await start(p);
  const b = await blocks(w.id);
  assert.deepEqual(b.map(x => x.kind), ['single', 'superset']);
  assert.equal(b[0].workout_exercises[0].performed_name, 'Warm up');
  const extra = checked(await client.rpc('add_workout_exercise', { workout_id: w.id, exercise_id: null, display_name: 'Extra' }));
  const next = await blocks(w.id);
  assert.deepEqual(next.map(x => x.kind), ['single', 'superset', 'single']);
  assert.equal(next[2].id, extra.block_id);
});

test('concurrent start retries create one block graph; source deletion cannot destroy history', async () => {
  const p = await plan();
  const id = randomUUID();
  const [a, b] = await Promise.all([start(p, { workout_id: id }), start(p, { workout_id: id })]);
  assert.equal(a.id, b.id);
  const graph = await blocks(id);
  assert.equal(graph.length, 1);
  assert.equal(graph[0].workout_exercises.length, 2);
  assert.equal((await coach.from('session_blocks').delete().eq('id', p.block.id)).error?.code, '23503');
  assert.equal((await blocks(id))[0].workout_exercises.length, 2);
});
