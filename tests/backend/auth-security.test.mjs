import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import { clients, seed, fixture as f, password, checked } from '../../scripts/seed-backend.mjs';

const { admin, anonymous, config } = clients();
let coach, otherCoach, client;
const endpoint = `${config.API_URL}/functions/v1/invite-client`;
async function invoke(sb, body, overrides = {}) {
  return fetch(endpoint, {
    method: 'POST', headers: { apikey: config.ANON_KEY, 'Content-Type': 'application/json',
      ...(sb ? { Authorization: `Bearer ${(await sb.auth.getSession()).data.session.access_token}` } : {}) },
    body: JSON.stringify(body), ...overrides,
  });
}
async function mailFor(email, subject) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const list = await fetch(`${config.MAILPIT_URL}/api/v1/messages?limit=200`).then(r => r.json());
    const mail = list.messages.find(m => m.To.some(to => to.Address === email) && m.Subject.includes(subject));
    if (mail) return fetch(`${config.MAILPIT_URL}/api/v1/message/${mail.ID}`).then(r => r.json());
    await setTimeout(100);
  }
  assert.fail(`No ${subject} message for this test account`);
}
const linkOf = mail => mail.HTML.match(/href="([^"]+)"/)[1].replaceAll('&amp;', '&');
async function redeem(link) {
  const response = await fetch(link, { redirect: 'manual' });
  assert.equal(response.status, 303);
  const destination = new URL(response.headers.get('location'));
  assert.equal(destination.origin, 'http://127.0.0.1:5173');
  assert.equal(destination.pathname, '/auth/callback');
  return new URLSearchParams(destination.hash.slice(1));
}
before(async () => {
  await seed();
  [coach, otherCoach, client] = await Promise.all(['coach', 'othercoach', 'client'].map(async name => {
    const sb = anonymous();
    checked(await sb.auth.signInWithPassword({ email: `${name}@example.test`, password }));
    return sb;
  }));
});

test('invitation HTTP boundary rejects malformed input, unauthenticated and forged tokens', async () => {
  assert.equal((await fetch(endpoint, { method: 'OPTIONS' })).status, 204);
  assert.equal((await fetch(endpoint)).status, 405);
  assert.equal((await invoke(null, {})).status, 401);
  assert.equal((await invoke(client, {})).status, 403);
  for (const body of [null, [], 'text', {}, { name: 'x', email: 'invalid' }, { name: 'x'.repeat(201), email: 'test@example.test' }]) {
    assert.equal((await invoke(coach, body)).status, 400);
  }
  assert.equal((await invoke(coach, {}, { body: '{' })).status, 400);
  const token = (await coach.auth.getSession()).data.session.access_token;
  const parts = token.split('.');
  const claims = JSON.parse(Buffer.from(parts[1], 'base64url'));
  parts[1] = Buffer.from(JSON.stringify({ ...claims, sub: f.otherClient, role: 'service_role' })).toString('base64url');
  for (const invalid of ['not-a-jwt', parts.join('.')]) {
    const response = await fetch(endpoint, { method: 'POST', headers: { apikey: config.ANON_KEY, Authorization: `Bearer ${invalid}`, 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(response.status, 401);
    const tableResponse = await fetch(`${config.API_URL}/rest/v1/profiles?select=*`, { headers: { apikey: config.ANON_KEY, Authorization: `Bearer ${invalid}` } });
    assert.equal(tableResponse.status, 401);
  }
});

test('concurrent and repeated invitations preserve the original identity and relationship', async () => {
  const email = `retry-${randomUUID()}@example.test`;
  const body = { email, name: 'Original client', redirectTo: 'https://attacker.example/steal-session' };
  const responses = await Promise.all([invoke(coach, body), invoke(coach, body)]);
  assert.deepEqual(responses.map(r => r.status).sort(), [201, 409]);
  const created = await responses.find(r => r.status === 201).json();
  assert.equal((await invoke(coach, body)).status, 409);
  assert.equal((await invoke(otherCoach, body)).status, 409);
  const user = checked(await admin.auth.admin.getUserById(created.clientId)).user;
  assert.equal(user.email, email);
  assert.equal(user.user_metadata.display_name, 'Original client');
  assert.equal(checked(await admin.from('coach_clients').select().eq('client_id', user.id)).length, 1);
  assert.equal(checked(await admin.from('coach_clients').select().eq('id', created.relationshipId).single()).coach_id, f.coach);
  assert.equal((await invoke(otherCoach, { resend: true, clientId: user.id })).status, 403);
  const mail = await mailFor(email, 'invited');
  const tokens = await redeem(linkOf(mail));
  assert.ok(tokens.get('access_token'));
  const invited = anonymous();
  checked(await invited.auth.setSession({ access_token: tokens.get('access_token'), refresh_token: tokens.get('refresh_token') }));
  checked(await invited.auth.updateUser({ password }));
  checked(await invited.rpc('accept_invitation', { relationship_id: created.relationshipId }));
  assert.equal((await invoke(coach, body)).status, 409);
  assert.equal((await invoke(coach, { resend: true, clientId: user.id })).status, 403);
  const replay = await redeem(linkOf(mail));
  assert.equal(replay.get('access_token'), null);
  assert.ok(replay.get('error'));
  assert.equal(checked(await admin.auth.admin.getUserById(user.id)).user.id, user.id);
});

test('scoped resend recovery link sets a password and is single-use', async () => {
  const email = `recovery-${randomUUID()}@example.test`;
  const response = await invoke(coach, { name: 'Recovery client', email });
  assert.equal(response.status, 201);
  const created = await response.json();
  assert.equal((await invoke(coach, { resend: true, clientId: created.clientId })).status, 200);
  const link = linkOf(await mailFor(email, 'Reset'));
  const tokens = await redeem(link);
  assert.ok(tokens.get('access_token'));
  const recovering = anonymous();
  checked(await recovering.auth.setSession({ access_token: tokens.get('access_token'), refresh_token: tokens.get('refresh_token') }));
  assert.ok((await recovering.auth.updateUser({ password: 'short' })).error);
  const newPassword = `${password}-recovered`;
  checked(await recovering.auth.updateUser({ password: newPassword }));
  checked(await recovering.rpc('accept_invitation', { relationship_id: created.relationshipId }));
  checked(await recovering.auth.signOut({ scope: 'local' }));
  assert.ok((await anonymous().auth.signInWithPassword({ email, password })).error);
  assert.equal(checked(await anonymous().auth.signInWithPassword({ email, password: newPassword })).user.id, created.clientId);
  const replay = await redeem(link);
  assert.equal(replay.get('access_token'), null);
  assert.ok(replay.get('error'));
});

test('internal helpers and Auth tables are not exposed by PostgREST', async () => {
  const token = (await client.auth.getSession()).data.session.access_token;
  const headers = { apikey: config.ANON_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const hiddenTable = await fetch(`${config.API_URL}/rest/v1/users?select=*`, { headers: { ...headers, 'Accept-Profile': 'auth' } });
  assert.equal(hiddenTable.status, 406);
  for (const name of ['session_snapshot', 'create_profile', 'validate_relationship', 'can_read_workout']) {
    const exposed = await fetch(`${config.API_URL}/rest/v1/rpc/${name}`, { method: 'POST', headers, body: '{}' });
    assert.equal(exposed.status, 404, name);
    const privateSchema = await fetch(`${config.API_URL}/rest/v1/rpc/${name}`, { method: 'POST', headers: { ...headers, 'Content-Profile': 'private' }, body: '{}' });
    assert.equal(privateSchema.status, 406, name);
  }
});
