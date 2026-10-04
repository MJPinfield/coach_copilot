import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { clients, seed, fixture as f, password, checked } from '../../tooling/seed-backend.mjs';

const { admin, anonymous } = clients();
let actors, rows;
const insert = async (sb, table, value) => checked(await sb.from(table).insert(value).select().single());
const select = (sb, table, key) => sb.from(table).select().match(key);
const keyOf = (table, row) => {
  const columns = {
    exercise_instructions: ['exercise_id', 'locale'], proposal_sessions: ['proposal_id', 'session_id'],
    proposal_exercise_sources: ['proposed_exercise_id', 'prescription_id'], workout_sources: ['workout_id', 'session_id'],
    workout_exercise_sources: ['workout_exercise_id', 'prescription_id'], workout_feedback: ['workout_id'],
  }[table] ?? ['id'];
  return Object.fromEntries(columns.map(key => [key, row[key]]));
};
async function deniedWrite(table, key, operation) {
  const before = checked(await select(admin, table, key));
  const result = await operation;
  if (result.error) assert.equal(result.error.code, '42501', `${table}: expected authorization denial, got ${JSON.stringify(result.error)}`);
  else assert.deepEqual(result.data, [], `${table}: unauthorized operation affected rows`);
  assert.deepEqual(checked(await select(admin, table, key)), before, `${table}: denial must preserve the stored row`);
}
async function plan(sb = actors.coach, relationship = f.relationship, status = 'published') {
  const programme = await insert(sb, 'programmes', { relationship_id: relationship, name: 'Permissions plan', status });
  const week = await insert(sb, 'programme_weeks', { programme_id: programme.id, position: 1, name: 'Week' });
  const session = await insert(sb, 'sessions', { week_id: week.id, position: 1, name: 'Session' });
  const block = await insert(sb, 'session_blocks', { session_id: session.id, position: 1, kind: 'single' });
  const prescription = await insert(sb, 'exercise_prescriptions', { session_id: session.id, block_id: block.id, exercise_id: f.exercise, position: 1, display_name: 'Press' });
  const set = await insert(sb, 'prescribed_sets', { prescription_id: prescription.id, position: 1, reps_min: 5 });
  return { programmes: programme, programme_weeks: week, sessions: session, session_blocks: block, exercise_prescriptions: prescription, prescribed_sets: set };
}
async function proposal(p, sb = admin, overrides = {}) {
  return checked(await sb.rpc('create_adaptation_proposal', {
    client_id: f.client, session_ids: [p.sessions.id], reason: 'Lower load',
    exercises: [{ exercise_id: f.exercise, position: 1, display_name: 'Press', targets: [{ position: 1, reps_min: 5 }], source_prescription_ids: [p.exercise_prescriptions.id] }],
    ...overrides,
  }));
}
before(async () => {
  await seed();
  actors = { anon: anonymous(), admin };
  for (const role of ['coach', 'client', 'otherCoach', 'otherClient']) {
    actors[role] = anonymous();
    checked(await actors[role].auth.signInWithPassword({ email: `${role.toLowerCase()}@example.test`, password }));
  }
  const p = await plan();
  const exercise = await insert(actors.coach, 'exercises', { source: 'custom', owner_coach_id: f.coach, name: 'Private catalogue fixture' });
  const instruction = await insert(actors.coach, 'exercise_instructions', { exercise_id: exercise.id, locale: 'en', text: 'Instructions' });
  const media = await insert(admin, 'exercise_media', { exercise_id: exercise.id, kind: 'thumbnail', attribution: 'Fixture' });
  const chat = await insert(actors.client, 'conversations', { client_id: f.client });
  const message = await insert(actors.client, 'messages', { conversation_id: chat.id, role: 'user', content: 'Help adapt this' });
  const a = await proposal(p, admin, { conversation_id: chat.id });
  const proposed = checked(await admin.from('proposed_exercises').select().eq('proposal_id', a.id).single());
  const workout = checked(await actors.client.rpc('start_workout', { workout_id: randomUUID(), session_ids: [p.sessions.id], proposal_id: a.id }));
  const occurrence = checked(await admin.from('workout_exercises').select().eq('workout_id', workout.id).single());
  checked(await actors.client.rpc('save_workout', { workout_id: workout.id, exercises: [], feedback: { notes: 'Feedback' } }));
  rows = {
    profiles: checked(await admin.from('profiles').select().eq('id', f.client).single()),
    coach_clients: checked(await admin.from('coach_clients').select().eq('id', f.relationship).single()),
    exercises: exercise, exercise_instructions: instruction, exercise_media: media, ...p,
    conversations: chat, messages: message, adaptation_proposals: a,
    proposal_sessions: checked(await admin.from('proposal_sessions').select().eq('proposal_id', a.id).single()),
    proposed_exercises: proposed,
    proposed_blocks: checked(await admin.from('proposed_blocks').select().eq('id', proposed.block_id).single()),
    proposal_exercise_sources: checked(await admin.from('proposal_exercise_sources').select().eq('proposed_exercise_id', proposed.id).single()),
    workouts: workout,
    workout_sources: checked(await admin.from('workout_sources').select().eq('workout_id', workout.id).single()),
    workout_exercises: occurrence,
    workout_blocks: checked(await admin.from('workout_blocks').select().eq('id', occurrence.block_id).single()),
    workout_exercise_sources: checked(await admin.from('workout_exercise_sources').select().eq('workout_exercise_id', occurrence.id).single()),
    logged_sets: checked(await admin.from('logged_sets').select().eq('workout_exercise_id', occurrence.id).single()),
    workout_feedback: checked(await admin.from('workout_feedback').select().eq('workout_id', workout.id).single()),
  };
});

// This inventory deliberately enumerates every domain table. The pgTAP inventory
// check fails when the schema grows without an accompanying matrix update.
const tables = [
  'profiles', 'coach_clients', 'exercises', 'exercise_instructions', 'exercise_media',
  'programmes', 'programme_weeks', 'sessions', 'session_blocks', 'exercise_prescriptions', 'prescribed_sets',
  'conversations', 'messages', 'adaptation_proposals', 'proposal_sessions', 'proposed_blocks', 'proposed_exercises', 'proposal_exercise_sources',
  'workouts', 'workout_sources', 'workout_blocks', 'workout_exercises', 'workout_exercise_sources', 'logged_sets', 'workout_feedback',
];
const coachEditable = ['exercises', 'exercise_instructions', 'programmes', 'programme_weeks', 'sessions', 'session_blocks', 'exercise_prescriptions', 'prescribed_sets'];
const privateTables = ['conversations', 'messages', 'adaptation_proposals', 'proposal_sessions', 'proposed_blocks', 'proposed_exercises', 'proposal_exercise_sources'];

for (const table of tables) {
  test(`${table}: role matrix for reads and forbidden direct C/U/D`, async () => {
    const row = rows[table];
    const key = keyOf(table, row);
    for (const [role, sb] of Object.entries(actors)) {
      const result = await select(sb, table, key);
      if (role === 'anon') assert.equal(result.error?.code, '42501', table);
      else {
        const canRead = role === 'admin' || role === 'client' || (role === 'coach' && !privateTables.includes(table));
        assert.equal(checked(result).length, canRead ? 1 : 0, `${role} SELECT ${table}`);
      }
      if (role === 'admin') continue;
      const ownerCanEdit = role === 'coach' && coachEditable.includes(table);
      const clientCanInsert = role === 'client' && ['conversations', 'messages'].includes(table);
      if (!ownerCanEdit && !clientCanInsert) {
        const value = { ...row, ...(row.id ? { id: randomUUID() } : {}) };
        if ('position' in value) value.position = 999;
        if (table === 'exercise_instructions') value.locale = 'zz';
        const result = await sb.from(table).insert(value).select();
        assert.equal(result.error?.code, '42501', `${role} INSERT ${table}: ${JSON.stringify(result)}`);
      }
      if (!ownerCanEdit && !(role === 'client' && table === 'profiles')) {
        // Send a valid existing field: a constraint error is not a permission test.
        const field = Object.keys(key)[0];
        const patch = table === 'profiles' ? { display_name: 'Unauthorized' } : { [field]: row[field] };
        await deniedWrite(table, key, sb.from(table).update(patch).match(key).select());
      }
      if (!ownerCanEdit && !(role === 'client' && table === 'conversations')) {
        await deniedWrite(table, key, sb.from(table).delete().match(key).select());
      }
    }
  });
}

test('profiles: own display name updates; identity, role and timestamps cannot change', async () => {
  for (const role of ['coach', 'client']) {
    const sb = actors[role];
    const original = checked(await sb.from('profiles').select().eq('id', f[role]).single());
    assert.equal(checked(await sb.from('profiles').update({ display_name: 'Changed' }).eq('id', f[role]).select().single()).display_name, 'Changed');
    for (const patch of [{ id: randomUUID() }, { role: 'coach' }, { created_at: new Date().toISOString() }]) {
      assert.equal((await sb.from('profiles').update(patch).eq('id', f[role])).error?.code, '42501');
    }
    assert.equal((await sb.from('profiles').update({ display_name: 'x'.repeat(201) }).eq('id', f[role])).error?.code, '23514');
    checked(await sb.from('profiles').update({ display_name: original.display_name }).eq('id', f[role]));
  }
});

test('programme hierarchy: owner CRUD, immutable parents, revision changes and cascading delete', async () => {
  const p = await plan();
  const other = await plan();
  const changes = { programmes: { name: 'Renamed' }, programme_weeks: { notes: 'Week notes' }, sessions: { notes: 'Session notes' }, session_blocks: { label: 'Block A' }, exercise_prescriptions: { coach_notes: 'New cue' }, prescribed_sets: { reps_min: 8 } };
  const parents = { programmes: ['relationship_id', f.relationship], programme_weeks: ['programme_id', other.programmes.id], sessions: ['week_id', other.programme_weeks.id], session_blocks: ['session_id', other.sessions.id], exercise_prescriptions: ['session_id', other.sessions.id], prescribed_sets: ['prescription_id', other.exercise_prescriptions.id] };
  for (const table of Object.keys(p)) {
    const revision = checked(await actors.coach.from('programmes').select('revision').eq('id', p.programmes.id).single()).revision;
    assert.equal(checked(await actors.coach.from(table).update(changes[table]).eq('id', p[table].id).select()).length, 1);
    assert.ok(checked(await actors.coach.from('programmes').select('revision').eq('id', p.programmes.id).single()).revision > revision);
    assert.equal((await actors.coach.from(table).update({ id: randomUUID() }).eq('id', p[table].id)).error?.code, '23514');
    const [field, value] = parents[table];
    if (table !== 'programmes') assert.equal((await actors.coach.from(table).update({ [field]: value }).eq('id', p[table].id)).error?.code, '23514');
  }
  // Individual deletes as well as a full aggregate cascade.
  for (const table of Object.keys(p).reverse()) {
    assert.equal(checked(await actors.coach.from(table).delete().eq('id', p[table].id).select()).length, 1, table);
    assert.deepEqual(checked(await select(admin, table, { id: p[table].id })), []);
  }
  checked(await actors.coach.from('programmes').delete().eq('id', other.programmes.id));
  for (const [table, row] of Object.entries(other)) assert.deepEqual(checked(await select(admin, table, { id: row.id })), []);
});

test('programme children: forged parent inserts are denied at every level', async () => {
  const p = await plan();
  for (const role of ['client', 'otherCoach', 'otherClient']) {
    for (const [table, row] of Object.entries(p)) {
      const value = { ...row, id: randomUUID(), ...('position' in row ? { position: 9 } : {}) };
      assert.equal((await actors[role].from(table).insert(value)).error?.code, '42501', `${role}/${table}`);
    }
  }
});

test('draft and archived plans hide every child; invited/inactive relationships cannot start workouts', async () => {
  const link = await insert(admin, 'coach_clients', { coach_id: f.coach, client_id: f.otherClient });
  const p = await plan(actors.coach, link.id, 'draft');
  try {
    for (const status of ['draft', 'archived', 'published']) {
      checked(await actors.coach.from('programmes').update({ status }).eq('id', p.programmes.id));
      for (const [table, row] of Object.entries(p)) assert.deepEqual(checked(await select(actors.otherClient, table, { id: row.id })), []);
      assert.equal((await actors.otherClient.rpc('start_workout', { workout_id: randomUUID(), session_ids: [p.sessions.id] })).error?.code, '42501');
    }
    checked(await actors.otherClient.rpc('accept_invitation', { relationship_id: link.id }));
    for (const status of ['draft', 'archived']) {
      checked(await actors.coach.from('programmes').update({ status }).eq('id', p.programmes.id));
      for (const [table, row] of Object.entries(p)) assert.deepEqual(checked(await select(actors.otherClient, table, { id: row.id })), []);
    }
    checked(await actors.coach.rpc('deactivate_relationship', { relationship_id: link.id }));
    for (const [table, row] of Object.entries(p)) {
      await deniedWrite(table, { id: row.id }, actors.coach.from(table).delete().eq('id', row.id).select());
    }
  } finally {
    checked(await admin.from('programmes').delete().eq('id', p.programmes.id));
    checked(await admin.from('coach_clients').delete().eq('id', link.id));
  }
});

test('custom catalogue: owner CRUD, instruction ownership and historical references', async () => {
  const e = await insert(actors.coach, 'exercises', { source: 'custom', owner_coach_id: f.coach, name: 'Temporary exercise' });
  const i = await insert(actors.coach, 'exercise_instructions', { exercise_id: e.id, locale: 'en', text: 'First' });
  assert.equal(checked(await actors.coach.from('exercises').update({ name: 'Updated' }).eq('id', e.id).select().single()).name, 'Updated');
  assert.equal(checked(await actors.coach.from('exercise_instructions').update({ text: 'Updated' }).match(keyOf('exercise_instructions', i)).select().single()).text, 'Updated');
  assert.ok((await actors.coach.from('exercises').update({ owner_coach_id: f.otherCoach }).eq('id', e.id)).error);
  assert.ok((await actors.coach.from('exercises').update({ source: 'synthetic', external_id: 'forged' }).eq('id', e.id)).error);
  assert.equal((await actors.coach.from('exercises').update({ id: randomUUID() }).eq('id', e.id)).error?.code, '23514');
  assert.equal((await actors.coach.from('exercise_instructions').update({ exercise_id: rows.exercises.id }).match(keyOf('exercise_instructions', i))).error?.code, '23514');
  const p = await plan();
  checked(await actors.coach.from('exercise_prescriptions').update({ exercise_id: e.id }).eq('id', p.exercise_prescriptions.id));
  assert.equal((await actors.coach.from('exercises').delete().eq('id', e.id)).error?.code, '23503');
  checked(await actors.coach.from('exercises').update({ retired_at: new Date().toISOString() }).eq('id', e.id));
  assert.equal((await actors.coach.from('exercise_prescriptions').insert({ session_id: p.sessions.id, block_id: p.session_blocks.id, exercise_id: e.id, position: 2, display_name: 'Retired' })).error?.code, '23514');
  checked(await actors.coach.from('programmes').delete().eq('id', p.programmes.id));
  assert.equal(checked(await actors.coach.from('exercise_instructions').delete().match(keyOf('exercise_instructions', i)).select()).length, 1);
  assert.equal(checked(await actors.coach.from('exercises').delete().eq('id', e.id).select()).length, 1);
});

test('chat lifecycle: own deletion cascades messages; linked proposals protect conversation provenance', async () => {
  const chat = await insert(actors.client, 'conversations', { client_id: f.client });
  const user = await insert(actors.client, 'messages', { conversation_id: chat.id, role: 'user', content: 'Question' });
  const assistant = await insert(admin, 'messages', { conversation_id: chat.id, role: 'assistant', content: 'Response' });
  for (const sb of [actors.coach, actors.otherCoach, actors.otherClient]) {
    assert.equal((await sb.from('messages').insert({ conversation_id: chat.id, role: 'user', content: 'Spoofed' })).error?.code, '42501');
    await deniedWrite('conversations', { id: chat.id }, sb.from('conversations').delete().eq('id', chat.id).select());
  }
  checked(await actors.client.from('conversations').delete().eq('id', chat.id));
  for (const m of [user, assistant]) assert.deepEqual(checked(await select(admin, 'messages', { id: m.id })), []);
  assert.equal((await actors.client.from('conversations').delete().eq('id', rows.conversations.id)).error?.code, '23503');
});

test('workout history prevents deletion of referenced programme/session/prescription and proposal', async () => {
  for (const table of ['programmes', 'programme_weeks', 'sessions', 'session_blocks', 'exercise_prescriptions']) {
    assert.equal((await actors.coach.from(table).delete().eq('id', rows[table].id)).error?.code, '23503', table);
    assert.equal(checked(await select(admin, table, { id: rows[table].id })).length, 1);
  }
  assert.equal((await admin.from('adaptation_proposals').delete().eq('id', rows.adaptation_proposals.id)).error?.code, '23503');
  assert.equal((await admin.from('coach_clients').delete().eq('id', f.relationship)).error?.code, '23503');
});

test('trusted catalogue writes enforce media rights and support media update/delete', async () => {
  for (const payload of [
    { asset_url: 'https://example.test/image.png', rights_reference: null },
    { asset_url: 'http://example.test/image.png', rights_reference: 'Test' },
    { asset_url: 'https://example.test/image.png', rights_reference: ' ' },
    { width: 0 }, { kind: 'video' },
  ]) assert.equal((await admin.from('exercise_media').insert({ exercise_id: f.exercise, kind: 'animation', attribution: 'Fixture', ...payload })).error?.code, '23514');
  const media = await insert(admin, 'exercise_media', { exercise_id: f.exercise, kind: 'animation', attribution: 'Fixture', asset_url: 'https://example.test/image.gif', rights_reference: 'Test licence' });
  assert.equal(checked(await admin.from('exercise_media').update({ width: 180 }).eq('id', media.id).select().single()).width, 180);
  assert.equal(checked(await actors.client.from('exercise_media').select().eq('id', media.id)).length, 1);
  checked(await admin.from('exercise_media').delete().eq('id', media.id));
  assert.deepEqual(checked(await select(admin, 'exercise_media', { id: media.id })), []);
});

test('all RPCs reject anonymous and unrelated callers; proposal rejection is owner-only and terminal', async () => {
  const p = await plan();
  const a = await proposal(p);
  const calls = {
    accept_invitation: { relationship_id: f.relationship }, deactivate_relationship: { relationship_id: f.relationship },
    start_workout: { workout_id: randomUUID(), session_ids: [p.sessions.id] },
    save_workout: { workout_id: rows.workouts.id, exercises: [] },
    abandon_workout: { workout_id: rows.workouts.id }, reject_proposal: { proposal_id: a.id },
    add_workout_exercise: { workout_id: rows.workouts.id, exercise_id: f.exercise, display_name: 'Extra' },
    create_adaptation_proposal: { client_id: f.client, session_ids: [p.sessions.id], reason: 'Forged', exercises: [] },
  };
  for (const [name, args] of Object.entries(calls)) {
    for (const role of ['anon', 'otherCoach', 'otherClient']) {
      assert.equal((await actors[role].rpc(name, args)).error?.code, '42501', `${role}/${name}`);
    }
  }
  checked(await actors.client.rpc('reject_proposal', { proposal_id: a.id }));
  assert.equal(checked(await admin.from('adaptation_proposals').select('status').eq('id', a.id).single()).status, 'rejected');
  assert.equal((await actors.client.rpc('reject_proposal', { proposal_id: a.id })).error?.code, '42501');
  assert.equal((await actors.client.rpc('start_workout', { workout_id: randomUUID(), session_ids: [p.sessions.id], proposal_id: a.id })).error?.code, '42501');
  checked(await admin.from('adaptation_proposals').delete().eq('id', a.id));
  for (const table of ['proposal_sessions', 'proposed_exercises']) assert.deepEqual(checked(await admin.from(table).select().eq('proposal_id', a.id)), []);
  assert.equal((await actors.client.rpc('reject_proposal', { proposal_id: rows.adaptation_proposals.id })).error?.code, '42501');
});

test('relationships: invalid roles rejected, participants immutable and activation retries scoped', async () => {
  assert.equal((await admin.from('coach_clients').insert({ coach_id: f.client, client_id: f.otherCoach })).error?.code, '23514');
  assert.equal((await admin.from('coach_clients').insert({ coach_id: f.coach, client_id: f.coach })).error?.code, '23514');
  for (const patch of [{ coach_id: f.otherCoach }, { client_id: f.otherClient }]) {
    assert.equal((await admin.from('coach_clients').update(patch).eq('id', f.relationship)).error?.code, '23514');
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    assert.equal(checked(await actors.client.rpc('accept_invitation', { relationship_id: f.relationship })).status, 'active');
  }
  assert.equal((await actors.coach.rpc('accept_invitation', { relationship_id: f.relationship })).error?.code, '42501');
  assert.equal((await actors.client.rpc('deactivate_relationship', { relationship_id: f.relationship })).error?.code, '42501');
});

test('exercise scope: unrelated custom movements cannot be prescribed, proposed or logged', async () => {
  const e = await insert(actors.otherCoach, 'exercises', { source: 'custom', owner_coach_id: f.otherCoach, name: 'Unrelated movement' });
  const p = await plan();
  assert.equal((await actors.coach.from('exercise_prescriptions').update({ exercise_id: e.id }).eq('id', p.exercise_prescriptions.id)).error?.code, '42501');
  await assert.rejects(proposal(p, admin, { exercises: [{ exercise_id: e.id, position: 1, display_name: 'Forbidden', targets: [], source_prescription_ids: [] }] }), /42501/);
  assert.equal((await actors.client.rpc('add_workout_exercise', { workout_id: rows.workouts.id, exercise_id: e.id, display_name: 'Forbidden' })).error?.code, '42501');
  assert.equal((await actors.client.rpc('save_workout', { workout_id: rows.workouts.id, exercises: [{ id: rows.workout_exercises.id, exercise_id: e.id, sets: [] }] })).error?.code, '42501');
  checked(await actors.otherCoach.from('exercises').delete().eq('id', e.id));
});

test('retirement prevents new extras/substitutions/proposals but preserves prescribed history', async () => {
  const e = await insert(actors.coach, 'exercises', { source: 'custom', owner_coach_id: f.coach, name: 'Retired movement' });
  const p = await plan();
  checked(await actors.coach.from('exercise_prescriptions').update({ exercise_id: e.id }).eq('id', p.exercise_prescriptions.id));
  checked(await actors.coach.from('exercises').update({ retired_at: new Date().toISOString() }).eq('id', e.id));
  const w = checked(await actors.client.rpc('start_workout', { workout_id: randomUUID(), session_ids: [p.sessions.id] }));
  assert.equal(w.original_snapshot[0].exercises[0].exercise_id, e.id);
  assert.equal((await actors.client.rpc('add_workout_exercise', { workout_id: rows.workouts.id, exercise_id: e.id, display_name: 'New extra' })).error?.code, '23514');
  assert.equal((await actors.client.rpc('save_workout', { workout_id: rows.workouts.id, exercises: [{ id: rows.workout_exercises.id, exercise_id: e.id, sets: [] }] })).error?.code, '23514');
  await assert.rejects(proposal(p, admin, { exercises: [{ exercise_id: e.id, position: 1, display_name: 'Retired', targets: [], source_prescription_ids: [] }] }), /42501/);
  checked(await actors.client.rpc('abandon_workout', { workout_id: w.id }));
  assert.equal(checked(await actors.client.from('exercises').select().eq('id', e.id)).length, 1);
});

test('programme constraints: names, positions, targets, uniqueness and missing foreign keys', async () => {
  const p = await plan();
  const patches = {
    programmes: [{ name: ' ' }, { name: 'x'.repeat(201) }, { status: 'unknown' }],
    programme_weeks: [{ position: 0 }, { name: '' }], sessions: [{ position: -1 }, { name: '' }],
    session_blocks: [{ position: 0 }, { kind: 'invalid' }, { rest_after_round_seconds: -1 }],
    exercise_prescriptions: [{ position: 0 }, { display_name: '' }],
    prescribed_sets: [{ load_kg: -1 }, { load_kg: 'NaN' }, { load_kg: 'Infinity' }, { reps_min: 0 },
      { reps_min: null, reps_max: 5 }, { reps_min: 5, reps_max: 4 }, { rir: 11 }, { rest_seconds: -1 }],
  };
  for (const [table, values] of Object.entries(patches)) {
    const original = checked(await select(admin, table, { id: p[table].id }));
    for (const patch of values) {
      assert.equal((await actors.coach.from(table).update(patch).eq('id', p[table].id)).error?.code, '23514', `${table}/${JSON.stringify(patch)}`);
      assert.deepEqual(checked(await select(admin, table, { id: p[table].id })), original);
    }
  }
  for (const table of ['programme_weeks', 'sessions', 'session_blocks', 'exercise_prescriptions', 'prescribed_sets']) {
    assert.equal((await actors.coach.from(table).insert({ ...p[table], id: randomUUID() })).error?.code, '23505', table);
  }
  assert.equal((await admin.from('exercise_prescriptions').insert({ session_id: randomUUID(), block_id: p.session_blocks.id, position: 1, display_name: 'Missing' })).error?.code, '23503');
});

test('proposal validation rejects malformed targets, foreign provenance and another client conversation atomically', async () => {
  const p = await plan();
  const other = await plan();
  const chat = await insert(actors.otherClient, 'conversations', { client_id: f.otherClient });
  const valid = { position: 1, exercise_id: f.exercise, display_name: 'Valid', targets: [{ position: 1 }], source_prescription_ids: [p.exercise_prescriptions.id] };
  const failures = [
    { session_ids: [] }, { session_ids: [p.sessions.id, p.sessions.id] }, { session_ids: [null] },
    { exercises: [] }, { exercises: {} }, { conversation_id: chat.id },
    { exercises: [{ ...valid, source_prescription_ids: [other.exercise_prescriptions.id] }] },
    { exercises: [{ ...valid, targets: null }] },
    { exercises: [{ ...valid, targets: [null] }] },
    { exercises: [{ ...valid, targets: [{ position: 0 }] }] },
    { exercises: [{ ...valid, targets: [{ position: 1, load_kg: 'NaN' }] }] },
    { exercises: [{ ...valid, targets: [{ position: 1, load_kg: 'Infinity' }] }] },
    { exercises: [{ ...valid, targets: [{ position: 1, reps_min: 5, reps_max: 4 }] }] },
    { exercises: [{ ...valid, targets: [{ position: 1, reps_max: 5 }] }] },
    { exercises: [{ ...valid, targets: [{ position: 1, rir: 11 }] }] },
    { exercises: [{ ...valid, targets: [{ position: 1, rest_seconds: -1 }] }] },
    { exercises: [{ ...valid, targets: [{ position: 1 }, { position: '01' }] }] },
    { exercises: [valid, valid] },
  ];
  for (const overrides of failures) {
    const reason = `Rollback ${randomUUID()}`;
    const result = await admin.rpc('create_adaptation_proposal', { client_id: f.client, session_ids: [p.sessions.id], reason, exercises: [valid], ...overrides });
    assert.ok(result.error, JSON.stringify(overrides));
    assert.deepEqual(checked(await admin.from('adaptation_proposals').select().eq('reason', reason)), []);
  }
  checked(await actors.otherClient.from('conversations').delete().eq('id', chat.id));
});

test('proposal source matching, structural revisions and concurrent application preserve a single outcome', async () => {
  const p = await plan();
  const other = await plan();
  const a = await proposal(p);
  assert.equal((await actors.client.rpc('start_workout', { workout_id: randomUUID(), session_ids: [other.sessions.id], proposal_id: a.id })).error?.code, '23514');
  const results = await Promise.all([randomUUID(), randomUUID()].map(workout_id => actors.client.rpc('start_workout', { workout_id, session_ids: [p.sessions.id], proposal_id: a.id })));
  assert.equal(results.filter(r => !r.error).length, 1);
  assert.equal(results.filter(r => r.error?.code === '42501').length, 1);
  assert.equal(checked(await admin.from('workouts').select().eq('proposal_id', a.id)).length, 1);
  const b = await proposal(other);
  checked(await actors.coach.from('prescribed_sets').delete().eq('id', other.prescribed_sets.id));
  assert.match((await actors.client.rpc('start_workout', { workout_id: randomUUID(), session_ids: [other.sessions.id], proposal_id: b.id })).error.message, /Programme changed/);
});

test('sessions cannot be combined across coaches even when the client has both relationships', async () => {
  const link = checked(await admin.from('coach_clients').upsert({ coach_id: f.otherCoach, client_id: f.client, status: 'active' }, { onConflict: 'coach_id,client_id' }).select().single());
  try {
    const a = await plan();
    const b = await plan(actors.otherCoach, link.id);
    await assert.rejects(proposal(a, admin, { session_ids: [a.sessions.id, b.sessions.id] }), /23514/);
    assert.equal((await actors.client.rpc('start_workout', { workout_id: randomUUID(), session_ids: [a.sessions.id, b.sessions.id] })).error?.code, '23514');
  } finally {
    checked(await actors.otherCoach.rpc('deactivate_relationship', { relationship_id: link.id }));
  }
});

test('workout invalid payloads roll back sets, feedback and substitutions together', async () => {
  const p = await plan();
  const w = checked(await actors.client.rpc('start_workout', { workout_id: randomUUID(), session_ids: [p.sessions.id] }));
  const e = checked(await actors.client.from('workout_exercises').select().eq('workout_id', w.id).single());
  const valid = { id: e.id, sets: [{ position: 1, reps: 6, load_kg: 50, completed: true }] };
  checked(await actors.client.rpc('save_workout', { workout_id: w.id, exercises: [valid], feedback: { notes: 'Original' } }));
  const before = checked(await actors.client.from('workout_exercises').select('*, logged_sets(*)').eq('id', e.id).single());
  const failures = [
    { exercises: {} }, { exercises: [valid, valid] },
    { exercises: [{ id: e.id, sets: null }] }, { exercises: [{ id: e.id, sets: [{}] }] },
    { exercises: [{ id: e.id, sets: [{ position: 0 }] }] },
    ...[{ reps: -1 }, { load_kg: -1 }, { load_kg: 'NaN' }, { load_kg: 'Infinity' }, { rir: 11 }].map(value => ({ exercises: [{ id: e.id, sets: [{ position: 1, ...value }] }] })),
    { exercises: [{ id: e.id, sets: [{ position: 1 }, { position: 1 }] }] },
    { exercises: [{ ...valid, performed_name: '' }] },
    { exercises: [{ ...valid, performed_name: 'Rollback me' }, { id: rows.workout_exercises.id, sets: [] }] },
    ...[{ energy: 'unknown' }, { sleep_hours: 25 }, { pain_severity: -1 }, []].map(feedback => ({ feedback })),
  ];
  for (const invalid of failures) {
    const result = await actors.client.rpc('save_workout', { workout_id: w.id, exercises: [valid], complete: true, ...invalid });
    assert.ok(result.error, JSON.stringify(invalid));
    assert.deepEqual(checked(await actors.client.from('workout_exercises').select('*, logged_sets(*)').eq('id', e.id).single()), before);
    assert.equal(checked(await actors.client.from('workout_feedback').select().eq('workout_id', w.id).single()).notes, 'Original');
    assert.equal(checked(await actors.client.from('workouts').select().eq('id', w.id).single()).status, 'in_progress');
  }
  // Deleting actual sets is supported by replacing the draft array with [].
  checked(await actors.client.rpc('save_workout', { workout_id: w.id, exercises: [{ id: e.id, sets: [] }] }));
  assert.deepEqual(checked(await actors.client.from('logged_sets').select().eq('workout_exercise_id', e.id)), []);
  assert.equal(checked(await actors.client.from('workout_exercises').select().eq('id', e.id).single()).applied_snapshot.targets.length, 1);
});

test('start rejects changed retry inputs, malformed sources and readiness; closed workouts are immutable', async () => {
  const p = await plan();
  for (const overrides of [{ session_ids: [] }, { session_ids: [null] }, { session_ids: [p.sessions.id, p.sessions.id] }, { readiness: [] }]) {
    const id = randomUUID();
    assert.ok((await actors.client.rpc('start_workout', { workout_id: id, session_ids: [p.sessions.id], ...overrides })).error);
    assert.deepEqual(checked(await select(admin, 'workouts', { id })), []);
  }
  const w = checked(await actors.client.rpc('start_workout', { workout_id: randomUUID(), session_ids: [p.sessions.id] }));
  assert.equal((await actors.client.rpc('start_workout', { workout_id: w.id, session_ids: [p.sessions.id], readiness: { energy: 'low' } })).error?.code, '23514');
  assert.equal((await actors.otherClient.rpc('start_workout', { workout_id: w.id, session_ids: [p.sessions.id] })).error?.code, '42501');
  const done = checked(await actors.client.rpc('save_workout', { workout_id: w.id, exercises: [], complete: true }));
  assert.ok(done.completed_at);
  for (const [name, args] of Object.entries({ save_workout: { exercises: [] }, abandon_workout: {}, add_workout_exercise: { exercise_id: null, display_name: 'Extra' } })) {
    assert.ok((await actors.client.rpc(name, { workout_id: w.id, ...args })).error, name);
  }
  assert.deepEqual(checked(await actors.client.rpc('save_workout', { workout_id: w.id, exercises: [], complete: true, feedback: { notes: 'Ignored replay' } })), done);
  assert.deepEqual(checked(await actors.client.from('workout_feedback').select().eq('workout_id', w.id)), []);
});

test('deactivation revokes coach history/profile access; client can finish their existing draft', async () => {
  const p = await plan();
  const w = checked(await actors.client.rpc('start_workout', { workout_id: randomUUID(), session_ids: [p.sessions.id] }));
  const e = checked(await actors.client.from('workout_exercises').select().eq('workout_id', w.id).single());
  checked(await actors.coach.rpc('deactivate_relationship', { relationship_id: f.relationship }));
  try {
    assert.deepEqual(checked(await select(actors.coach, 'profiles', { id: f.client })), []);
    assert.deepEqual(checked(await select(actors.client, 'profiles', { id: f.coach })), []);
    for (const table of ['workouts', 'workout_sources', 'workout_blocks', 'workout_exercises', 'workout_exercise_sources', 'logged_sets', 'workout_feedback', 'exercises', 'exercise_instructions', 'exercise_media']) {
      const sb = table.startsWith('exercise') ? actors.client : actors.coach;
      assert.deepEqual(checked(await select(sb, table, keyOf(table, rows[table]))), [], table);
    }
    const saved = checked(await actors.client.rpc('save_workout', { workout_id: w.id, exercises: [{ id: e.id, sets: [{ position: 1, reps: 0, completed: false }] }], complete: true }));
    assert.equal(saved.status, 'completed');
    assert.equal(checked(await actors.client.from('logged_sets').select().eq('workout_exercise_id', e.id).single()).reps, 0);
  } finally {
    checked(await admin.from('coach_clients').update({ status: 'active' }).eq('id', f.relationship));
  }
});

test('trusted deletion of an unshared test aggregate cascades every workout and proposal child', async () => {
  const p = await plan();
  const a = await proposal(p);
  const proposed = checked(await admin.from('proposed_exercises').select().eq('proposal_id', a.id).single());
  const w = checked(await actors.client.rpc('start_workout', { workout_id: randomUUID(), session_ids: [p.sessions.id], proposal_id: a.id }));
  const e = checked(await admin.from('workout_exercises').select().eq('workout_id', w.id).single());
  checked(await actors.client.rpc('save_workout', { workout_id: w.id, exercises: [], feedback: { notes: 'Fixture' } }));
  checked(await admin.from('workouts').delete().eq('id', w.id));
  for (const table of ['workout_sources', 'workout_blocks', 'workout_exercises', 'workout_feedback']) assert.deepEqual(checked(await admin.from(table).select().eq('workout_id', w.id)), []);
  for (const table of ['workout_exercise_sources', 'logged_sets']) assert.deepEqual(checked(await admin.from(table).select().eq('workout_exercise_id', e.id)), []);
  checked(await admin.from('adaptation_proposals').delete().eq('id', a.id));
  assert.deepEqual(checked(await admin.from('proposal_exercise_sources').select().eq('proposed_exercise_id', proposed.id)), []);
  checked(await actors.coach.from('programmes').delete().eq('id', p.programmes.id));
});

test('shared imported catalogue is readable by all signed-in users and writable only by the service', async () => {
  const e = await insert(admin, 'exercises', { source: 'hasaneyldrm/exercises-dataset', external_id: `fixture-${randomUUID()}`, name: 'Imported fixture' });
  const instruction = await insert(admin, 'exercise_instructions', { exercise_id: e.id, locale: 'en', text: 'Imported instructions' });
  const media = await insert(admin, 'exercise_media', { exercise_id: e.id, kind: 'thumbnail', attribution: 'Fixture' });
  for (const [table, row] of Object.entries({ exercises: e, exercise_instructions: instruction, exercise_media: media })) {
    const key = keyOf(table, row);
    for (const role of ['coach', 'client', 'otherCoach', 'otherClient']) {
      const sb = actors[role];
      assert.equal(checked(await select(sb, table, key)).length, 1);
      const payload = table === 'exercises' ? { ...e, id: randomUUID(), external_id: randomUUID() }
        : table === 'exercise_instructions' ? { ...instruction, locale: 'zz' } : { ...media, id: randomUUID(), kind: 'animation' };
      assert.equal((await sb.from(table).insert(payload)).error?.code, '42501');
      const patch = table === 'exercises' ? { name: 'Tampered' } : table === 'exercise_instructions' ? { text: 'Tampered' } : { attribution: 'Tampered' };
      await deniedWrite(table, key, sb.from(table).update(patch).match(key).select());
      await deniedWrite(table, key, sb.from(table).delete().match(key).select());
    }
  }
  checked(await admin.from('exercises').update({ name: 'Updated import' }).eq('id', e.id));
  checked(await admin.from('exercise_instructions').update({ text: 'Updated import' }).eq('exercise_id', e.id));
  for (const table of ['exercise_media', 'exercise_instructions']) checked(await admin.from(table).delete().eq('exercise_id', e.id));
  checked(await admin.from('exercises').delete().eq('id', e.id));
});

test('a programme cannot be reassigned even to another relationship owned by the same coach', async () => {
  const link = await insert(admin, 'coach_clients', { coach_id: f.coach, client_id: f.otherClient, status: 'active' });
  const p = await plan();
  try {
    assert.equal((await actors.coach.from('programmes').update({ relationship_id: link.id }).eq('id', p.programmes.id)).error?.code, '23514');
    assert.equal(checked(await admin.from('programmes').select().eq('id', p.programmes.id).single()).relationship_id, f.relationship);
  } finally {
    checked(await admin.from('coach_clients').delete().eq('id', link.id));
  }
});

test('archiving after completion hides the plan but keeps immutable workout history for its participants', async () => {
  const p = await plan();
  const w = checked(await actors.client.rpc('start_workout', { workout_id: randomUUID(), session_ids: [p.sessions.id] }));
  checked(await actors.client.rpc('save_workout', { workout_id: w.id, exercises: [], complete: true }));
  checked(await actors.coach.from('programmes').update({ status: 'archived' }).eq('id', p.programmes.id));
  assert.deepEqual(checked(await select(actors.client, 'programmes', { id: p.programmes.id })), []);
  for (const sb of [actors.client, actors.coach]) {
    const history = checked(await sb.from('workouts').select().eq('id', w.id).single());
    assert.equal(history.status, 'completed');
    assert.deepEqual(history.original_snapshot, w.original_snapshot);
  }
});
