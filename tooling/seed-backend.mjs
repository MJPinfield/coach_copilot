import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'node:url';
import { localConfig } from './supabase.mjs';

export const password = 'Local-training-only-2026!';
export const fixture = {
  coach: '11111111-1111-4111-8111-111111111111',
  client: '22222222-2222-4222-8222-222222222222',
  otherCoach: '33333333-3333-4333-8333-333333333333',
  otherClient: '44444444-4444-4444-8444-444444444444',
  relationship: '55555555-5555-4555-8555-555555555555',
  exercise: '66666666-6666-4666-8666-666666666666',
};
export function checked(result) {
  if (result.error) throw new Error(`${result.error.code ?? ''}: ${result.error.message}`);
  return result.data;
}
export function clients() {
  const config = localConfig();
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  return {
    config,
    admin: createClient(config.API_URL, config.SERVICE_ROLE_KEY, options),
    anonymous: () => createClient(config.API_URL, config.ANON_KEY, options),
  };
}
export async function seed() {
  const { admin } = clients();
  for (const [name, role] of [['coach', 'coach'], ['client', 'client'], ['otherCoach', 'coach'], ['otherClient', 'client']]) {
    const existing = await admin.auth.admin.getUserById(fixture[name]);
    if (!existing.data.user) checked(await admin.auth.admin.createUser({ id: fixture[name], email: `${name.toLowerCase()}@example.test`, password, email_confirm: true, user_metadata: { display_name: `Demo ${name}` } }));
    checked(await admin.from('profiles').update({ role }).eq('id', fixture[name]));
  }
  checked(await admin.from('coach_clients').upsert({ id: fixture.relationship, coach_id: fixture.coach, client_id: fixture.client, status: 'active' }));
  checked(await admin.from('coach_clients').upsert({ coach_id: fixture.otherCoach, client_id: fixture.otherClient, status: 'active' }, { onConflict: 'coach_id,client_id' }));
  checked(await admin.from('exercises').upsert({ id: fixture.exercise, source: 'synthetic', external_id: 'test-press', name: 'Fixture press', equipment: 'barbell' }));
  checked(await admin.from('exercise_instructions').upsert({ exercise_id: fixture.exercise, locale: 'en', text: 'Synthetic exercise used only by backend tests.', steps: ['Prepare the test fixture.'] }));
  return fixture;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await seed();
  console.log('Local Auth accounts ready: coach@example.test and client@example.test');
  console.log(`Development-only password: ${password}`);
}
