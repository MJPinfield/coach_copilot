import { createClient } from 'npm:@supabase/supabase-js@2.117.2';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};
const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return reply(405, { error: 'POST required' });
  const url = Deno.env.get('SUPABASE_URL')!;
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return reply(401, { error: 'Authentication required' });
  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user) return reply(401, { error: 'Authentication required' });
  const { data: coach } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (coach?.role !== 'coach') return reply(403, { error: 'Coach access required' });
  try {
    const body = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) return reply(400, { error: 'An object is required' });
    // Redirect destination is server configuration, never caller-controlled.
    const redirectTo = `${Deno.env.get('APP_URL') || 'http://127.0.0.1:5173'}/auth/callback`;
    if (body.resend === true) {
      const { data: relationship, error } = await admin.from('coach_clients').select('client_id')
        .eq('coach_id', user.id).eq('client_id', body.clientId).eq('status', 'invited').maybeSingle();
      if (error || !relationship) return reply(403, { error: 'Pending invitation not available' });
      const { data: existing } = await admin.auth.admin.getUserById(relationship.client_id);
      if (!existing.user?.email) return reply(404, { error: 'Client not available' });
      const { error: sendError } = await admin.auth.resetPasswordForEmail(existing.user.email, { redirectTo });
      if (sendError) throw sendError;
      return reply(200, { clientId: relationship.client_id, resent: true });
    }
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!name || name.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return reply(400, { error: 'A name and valid email are required' });
    }
    // Reserve a new identity first. inviteUserByEmail can return an existing,
    // unconfirmed user, so its response alone does not establish cleanup ownership.
    const { data, error } = await admin.auth.admin.createUser({ email, email_confirm: false, user_metadata: { display_name: name } });
    if (error) return reply(409, { error: 'Account already exists or cannot be invited; use resend for your pending invitation' });
    const { data: relationship, error: linkError } = await admin.from('coach_clients')
      .insert({ coach_id: user.id, client_id: data.user.id }).select('id').single();
    if (linkError) {
      // Only this attempt's newly reserved identity is eligible for cleanup.
      const cleanup = await admin.auth.admin.deleteUser(data.user.id);
      if (cleanup.error) console.error('Invitation cleanup failed', cleanup.error.message);
      throw linkError;
    }
    const { error: sendError } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });
    if (sendError) {
      // Keep the established relationship so its coach can retry via resend.
      console.error('Invitation delivery failed', sendError.message);
      return reply(502, { error: 'Invitation created but email delivery failed; use resend', clientId: data.user.id, relationshipId: relationship.id });
    }
    return reply(201, { clientId: data.user.id, relationshipId: relationship.id });
  } catch (error) {
    console.error('Invite failed', error instanceof Error ? error.message : error);
    return reply(400, { error: 'Invitation could not be completed' });
  }
});
