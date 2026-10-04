import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { clients, seed, fixture as f, password, checked } from '../../scripts/seed-backend.mjs';

const { admin, anonymous, config } = clients();
let coach, client, otherCoach, otherClient;
async function signIn(name) {
  const sb = anonymous();
  checked(await sb.auth.signInWithPassword({ email: `${name}@example.test`, password }));
  return sb;
}
before(async () => {
  await seed();
  [coach, client, otherCoach, otherClient] = await Promise.all(['coach', 'client', 'othercoach', 'otherclient'].map(signIn));
});
async function plan(status = 'published') {
  const programme = checked(await coach.from('programmes').insert({ relationship_id: f.relationship, name: 'Integration plan', status }).select().single());
  const week = checked(await coach.from('programme_weeks').insert({ programme_id: programme.id, position: 1, name: 'Block 1' }).select().single());
  const session = checked(await coach.from('sessions').insert({ week_id: week.id, position: 1, name: 'Upper' }).select().single());
  const exercise = checked(await coach.from('exercise_prescriptions').insert({ session_id: session.id, exercise_id: f.exercise, position: 1, display_name: 'Press', coach_notes: 'Pause first rep' }).select().single());
  const set = checked(await coach.from('prescribed_sets').insert({ prescription_id: exercise.id, position: 1, load_kg: 70, reps_min: 5, reps_max: 8, rir: 2 }).select().single());
  return { programme, week, session, exercise, set };
}
async function start(p, options = {}) {
  return checked(await client.rpc('start_workout', { workout_id: randomUUID(), session_ids: [p.session.id], ...options }));
}
async function performed(workout) {
  return checked(await client.from('workout_exercises').select('*,logged_sets(*)').eq('workout_id', workout.id).single());
}
const values = exercise => [{ id: exercise.id, sets: [{ position: 1, load_kg: 72.5, reps: 6, rir: 2, completed: true }] }];
async function proposal(p, sourceSessions = [p.session.id]) {
  const conversation = checked(await client.from('conversations').insert({ client_id: f.client }).select().single());
  return checked(await admin.rpc('create_adaptation_proposal', {
    client_id: f.client, session_ids: sourceSessions, conversation_id: conversation.id, reason: 'Shorter session requested',
    exercises: [{ exercise_id: f.exercise, position: 1, display_name: 'Lighter press', targets: [{ position: 1, load_kg: 50, reps_min: 5 }], source_prescription_ids: [p.exercise.id] }],
  }));
}

test('real Auth sign-in, session refresh and logout; public signup is disabled', async () => {
  const sb = await signIn('client');
  assert.equal(checked(await sb.auth.getUser()).user.id, f.client);
  assert.ok(checked(await sb.auth.refreshSession()).session.access_token);
  checked(await sb.auth.signOut({ scope: 'local' }));
  assert.equal((await sb.auth.getSession()).data.session, null);
  assert.ok((await anonymous().auth.signInWithPassword({ email: 'client@example.test', password: 'wrong' })).error);
  assert.ok((await anonymous().auth.signUp({ email: `signup-${randomUUID()}@example.test`, password })).error);
});

test('profile provisioning ignores user role metadata and clients cannot promote themselves', async () => {
  const user = checked(await admin.auth.admin.createUser({ email: `role-${randomUUID()}@example.test`, password, email_confirm: true, user_metadata: { role: 'coach', display_name: 'Test client' } })).user;
  assert.equal(checked(await admin.from('profiles').select('role').eq('id', user.id).single()).role, 'client');
  assert.ok((await client.from('profiles').update({ role: 'coach' }).eq('id', f.client)).error);
  checked(await client.auth.updateUser({ data: { role: 'coach' } }));
  assert.equal(checked(await client.from('profiles').select('role').eq('id', f.client).single()).role, 'client');
  checked(await admin.auth.admin.deleteUser(user.id));
});

test('RLS separates clients/coaches; draft children are hidden until published', async () => {
  const p = await plan('draft');
  for (const sb of [client, otherClient, otherCoach]) {
    assert.deepEqual(checked(await sb.from('programmes').select().eq('id', p.programme.id)), []);
    assert.deepEqual(checked(await sb.from('sessions').select().eq('id', p.session.id)), []);
    assert.deepEqual(checked(await sb.from('prescribed_sets').select().eq('id', p.set.id)), []);
  }
  assert.ok((await anonymous().from('programmes').select()).error);
  assert.ok((await client.from('programmes').insert({ relationship_id: f.relationship, name: 'Forbidden' })).error);
  assert.ok((await otherCoach.from('programmes').insert({ relationship_id: f.relationship, name: 'Forbidden' })).error);
  checked(await coach.from('programmes').update({ status: 'published' }).eq('id', p.programme.id));
  assert.equal(checked(await client.from('prescribed_sets').select().eq('id', p.set.id)).length, 1);
  assert.deepEqual(checked(await otherClient.from('programmes').select().eq('id', p.programme.id)), []);
  const attempt = await client.from('prescribed_sets').update({ load_kg: 999 }).eq('id', p.set.id).select();
  assert.ok(attempt.error || attempt.data.length === 0);
  assert.equal(checked(await coach.from('prescribed_sets').select('load_kg').eq('id', p.set.id).single()).load_kg, 70);
});

test('workout start is idempotent and snapshots survive programme edits', async () => {
  const p = await plan();
  const id = randomUUID();
  const [a, b] = await Promise.all([start(p, { workout_id: id }), start(p, { workout_id: id })]);
  assert.equal(a.id, b.id);
  assert.equal(checked(await client.from('workout_exercises').select().eq('workout_id', id)).length, 1);
  checked(await coach.from('prescribed_sets').update({ load_kg: 90 }).eq('id', p.set.id));
  const e = await performed(a);
  assert.equal(e.applied_snapshot.targets[0].load_kg, 70);
  assert.equal(e.logged_sets[0].reps, null);
  assert.equal(e.logged_sets[0].completed, false);
  assert.ok((await coach.from('programmes').update({ relationship_id: randomUUID() }).eq('id', p.programme.id)).error);
});

test('draft saves resume via fresh login; failed completion rolls back all writes; completion retries do not duplicate', async () => {
  const w = await start(await plan());
  const e = await performed(w);
  checked(await client.rpc('save_workout', { workout_id: w.id, exercises: values(e), feedback: { notes: 'Draft' } }));
  const fresh = await signIn('client');
  assert.equal(checked(await fresh.from('logged_sets').select().eq('workout_exercise_id', e.id).single()).reps, 6);
  const invalid = await client.rpc('save_workout', { workout_id: w.id, exercises: [{ id: e.id, sets: [{ position: 1, reps: 99 }] }], feedback: { pain_severity: 11 }, complete: true });
  assert.ok(invalid.error);
  assert.equal((await performed(w)).logged_sets[0].reps, 6);
  assert.equal(checked(await client.from('workouts').select().eq('id', w.id).single()).status, 'in_progress');
  const payload = { workout_id: w.id, exercises: values(e), feedback: { notes: 'Finished', pain_reported: false }, complete: true };
  for (const result of await Promise.all([client.rpc('save_workout', payload), fresh.rpc('save_workout', payload)])) assert.equal(checked(result).status, 'completed');
  assert.equal((await performed(w)).logged_sets.length, 1);
  assert.equal(checked(await client.from('workout_feedback').select().eq('workout_id', w.id)).length, 1);
  assert.equal(checked(await coach.from('workouts').select().eq('id', w.id)).length, 1);
  assert.deepEqual(checked(await otherCoach.from('workouts').select().eq('id', w.id)), []);
  assert.deepEqual(checked(await otherClient.from('logged_sets').select().eq('workout_exercise_id', e.id)), []);
  assert.ok((await otherClient.rpc('save_workout', payload)).error);
  assert.ok((await client.from('workouts').update({ status: 'in_progress' }).eq('id', w.id)).error);
});

test('chat is private even to the coach and clients cannot forge assistant responses', async () => {
  const chat = checked(await client.from('conversations').insert({ client_id: f.client, title: 'Private readiness' }).select().single());
  checked(await client.from('messages').insert({ conversation_id: chat.id, role: 'user', content: 'Feeling tired' }));
  assert.ok((await client.from('messages').insert({ conversation_id: chat.id, role: 'assistant', content: 'Forged advice' })).error);
  for (const sb of [coach, otherClient]) {
    assert.deepEqual(checked(await sb.from('conversations').select().eq('id', chat.id)), []);
    assert.deepEqual(checked(await sb.from('messages').select().eq('conversation_id', chat.id)), []);
  }
  assert.ok((await client.from('conversations').insert({ client_id: f.otherClient })).error);
});

test('client applies a combined proposal once; original plan remains unchanged and coach sees reason not chat', async () => {
  const p = await plan();
  const second = checked(await coach.from('sessions').insert({ week_id: p.week.id, position: 2, name: 'Lower' }).select().single());
  const a = await proposal(p, [p.session.id, second.id]);
  const w = await start(p, { session_ids: [p.session.id, second.id], proposal_id: a.id });
  assert.equal(w.adaptation_reason, 'Shorter session requested');
  assert.equal(w.original_snapshot.length, 2);
  assert.equal((await performed(w)).applied_snapshot.targets[0].load_kg, 50);
  assert.equal(checked(await coach.from('prescribed_sets').select().eq('id', p.set.id).single()).load_kg, 70);
  assert.deepEqual(checked(await coach.from('adaptation_proposals').select().eq('id', a.id)), []);
  assert.equal(checked(await coach.from('workouts').select().eq('id', w.id).single()).adaptation_reason, a.reason);
  assert.ok((await client.rpc('start_workout', { workout_id: randomUUID(), session_ids: [p.session.id, second.id], proposal_id: a.id })).error);
});

test('stale and cross-client proposals cannot be applied', async () => {
  const p = await plan();
  const a = await proposal(p);
  checked(await coach.from('prescribed_sets').update({ load_kg: 80 }).eq('id', p.set.id));
  const result = await client.rpc('start_workout', { workout_id: randomUUID(), session_ids: [p.session.id], proposal_id: a.id });
  assert.match(result.error.message, /Programme changed/);
  assert.ok((await otherClient.rpc('start_workout', { workout_id: randomUUID(), session_ids: [p.session.id], proposal_id: a.id })).error);
  assert.equal(checked(await client.from('adaptation_proposals').select().eq('id', a.id).single()).status, 'proposed');
});

test('proposal creation is server-only and invalid proposal contents roll back atomically', async () => {
  const p = await plan();
  const body = { client_id: f.client, session_ids: [p.session.id], reason: `invalid-${randomUUID()}`,
    exercises: [{ position: 1, display_name: 'Press', exercise_id: f.exercise, targets: [{ position: 1, load_kg: -5 }], source_prescription_ids: [p.exercise.id] }] };
  assert.ok((await client.rpc('create_adaptation_proposal', body)).error);
  assert.ok((await admin.rpc('create_adaptation_proposal', body)).error);
  assert.deepEqual(checked(await admin.from('adaptation_proposals').select().eq('reason', body.reason)), []);
  assert.ok((await admin.rpc('create_adaptation_proposal', { ...body, client_id: f.otherClient })).error);
});

test('extra exercises and substitutions preserve the applied prescription; abandoned attempts remain distinct', async () => {
  const w = await start(await plan());
  const original = await performed(w);
  const extra = checked(await client.rpc('add_workout_exercise', { workout_id: w.id, exercise_id: null, display_name: 'Unplanned movement' }));
  assert.deepEqual(extra.applied_snapshot, { extra: true });
  checked(await client.rpc('save_workout', { workout_id: w.id, exercises: [{ id: original.id, exercise_id: null, performed_name: 'Different movement', sets: [] }, { id: extra.id, sets: [{ position: 1, reps: 8 }] }] }));
  const saved = checked(await client.from('workout_exercises').select().eq('id', original.id).single());
  assert.equal(saved.performed_name, 'Different movement');
  assert.equal(saved.applied_snapshot.display_name, 'Press');
  checked(await client.rpc('abandon_workout', { workout_id: w.id }));
  assert.equal(checked(await client.from('workouts').select().eq('id', w.id).single()).status, 'abandoned');
  assert.ok((await client.rpc('save_workout', { workout_id: w.id, exercises: [], complete: true })).error);
});

test('invitation acceptance affects only the specified relationship; inactive clients cannot start new work', async () => {
  const link = checked(await admin.from('coach_clients').upsert({ coach_id: f.otherCoach, client_id: f.client, status: 'invited' }, { onConflict: 'coach_id,client_id' }).select().single());
  assert.ok((await otherClient.rpc('accept_invitation', { relationship_id: link.id })).error);
  assert.equal(checked(await client.rpc('accept_invitation', { relationship_id: link.id })).status, 'active');
  checked(await otherCoach.rpc('deactivate_relationship', { relationship_id: link.id }));
  assert.ok((await client.rpc('accept_invitation', { relationship_id: link.id })).error);
  const p = await plan();
  checked(await coach.rpc('deactivate_relationship', { relationship_id: f.relationship }));
  try {
    assert.ok((await client.rpc('start_workout', { workout_id: randomUUID(), session_ids: [p.session.id] })).error);
    assert.deepEqual(checked(await client.from('programmes').select().eq('id', p.programme.id)), []);
  } finally {
    checked(await admin.from('coach_clients').update({ status: 'active' }).eq('id', f.relationship));
  }
});

test('catalogue is readable but imported records/media cannot be overwritten by clients or coaches', async () => {
  assert.equal(checked(await client.from('exercises').select().eq('id', f.exercise)).length, 1);
  const update = await coach.from('exercises').update({ name: 'Corrupted' }).eq('id', f.exercise).select();
  assert.ok(update.error || update.data.length === 0);
  assert.ok((await client.from('exercise_media').insert({ exercise_id: f.exercise, kind: 'animation', attribution: 'test' })).error);
  const custom = checked(await coach.from('exercises').insert({ source: 'custom', owner_coach_id: f.coach, name: 'Custom movement' }).select().single());
  assert.equal(checked(await client.from('exercises').select().eq('id', custom.id)).length, 1);
  assert.deepEqual(checked(await otherClient.from('exercises').select().eq('id', custom.id)), []);
});

test('Edge invitation verifies authentication, coach role and resend ownership', async () => {
  const endpoint = `${config.API_URL}/functions/v1/invite-client`;
  const invoke = async (sb, body) => fetch(endpoint, { method: 'POST', headers: {
    apikey: config.ANON_KEY, 'Content-Type': 'application/json',
    ...(sb ? { Authorization: `Bearer ${(await sb.auth.getSession()).data.session.access_token}` } : {}),
  }, body: JSON.stringify(body) });
  assert.equal((await invoke(null, {})).status, 401);
  assert.equal((await invoke(client, {})).status, 403);
  assert.equal((await invoke(otherCoach, { resend: true, clientId: f.client })).status, 403);
  const email = `invited-${randomUUID()}@example.test`;
  const response = await invoke(coach, { name: 'Invited test client', email });
  const body = await response.json();
  assert.equal(response.status, 201, JSON.stringify(body));
  assert.equal(checked(await admin.from('coach_clients').select().eq('id', body.relationshipId).single()).status, 'invited');
  assert.equal(checked(await admin.from('profiles').select().eq('id', body.clientId).single()).role, 'client');
  // Actual local mail delivery is captured, not a mocked invocation.
  const mail = await fetch(`${config.MAILPIT_URL}/api/v1/messages`).then(r => r.json());
  const delivered = mail.messages.find(m => m.To.some(to => to.Address === email));
  assert.ok(delivered, 'Mailpit received this invitation');
  const message = await fetch(`${config.MAILPIT_URL}/api/v1/message/${delivered.ID}`).then(r => r.json());
  const link = message.HTML.match(/href="([^"]+)"/)[1].replaceAll('&amp;', '&');
  const verify = await fetch(link, { redirect: 'manual' });
  const redirect = new URL(verify.headers.get('location'));
  assert.equal(redirect.pathname, '/auth/callback');
  const tokens = new URLSearchParams(redirect.hash.slice(1));
  assert.ok(tokens.get('access_token'), 'Actual invitation link issues a session');
  const invited = anonymous();
  checked(await invited.auth.setSession({ access_token: tokens.get('access_token'), refresh_token: tokens.get('refresh_token') }));
  checked(await invited.auth.updateUser({ password }));
  assert.equal(checked(await invited.rpc('accept_invitation', { relationship_id: body.relationshipId })).status, 'active');
  const returning = anonymous();
  checked(await returning.auth.signInWithPassword({ email, password }));
  checked(await returning.auth.resetPasswordForEmail(email, { redirectTo: 'http://127.0.0.1:5173/auth/callback' }));
  const recoveryMail = await fetch(`${config.MAILPIT_URL}/api/v1/messages`).then(r => r.json());
  assert.ok(recoveryMail.messages.some(m => m.To.some(to => to.Address === email) && m.Subject.includes('Reset')));
});
