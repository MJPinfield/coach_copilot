import { clients, seed, checked, fixture, password } from './seed-backend.mjs';

await seed();
const { admin } = clients();
const id = '77777777-7777-4777-8777-777777777777';
const existing = await admin.auth.admin.getUserById(id);
if (!existing.data.user) checked(await admin.auth.admin.createUser({ id, email: 'training@example.test', password, email_confirm: true, user_metadata: { display_name: 'Demo client' } }));
const relationship = checked(await admin.from('coach_clients').upsert({ coach_id: fixture.coach, client_id: id, status: 'active' }, { onConflict: 'coach_id,client_id' }).select().single());
const programmes = checked(await admin.from('programmes').select('id').eq('relationship_id', relationship.id));
if (!programmes.length) {
  const insert = async (table, values) => checked(await admin.from(table).insert(values).select().single());
  const programme = await insert('programmes', { relationship_id: relationship.id, name: 'Demo · Strength foundations', status: 'published', goal: 'Fictional programme for trying the client journey.' });
  const week = await insert('programme_weeks', { programme_id: programme.id, position: 1, name: 'Week 1' });
  for (const [position, name, movements] of [[1, 'Upper body', ['Bench press', 'Bent-over row', 'Cable curl']], [2, 'Lower body', ['Goblet squat', 'Romanian deadlift', 'Calf raise']]]) {
    const session = await insert('sessions', { week_id: week.id, position, name, notes: 'Demo targets only. Switch exercises if equipment is busy.' });
    const pair = await insert('session_blocks', { session_id: session.id, kind: 'superset', position: 1, label: 'A', rest_after_round_seconds: 90 });
    const single = await insert('session_blocks', { session_id: session.id, kind: 'single', position: 2, label: 'B' });
    for (const [index, movement] of movements.entries()) {
      const prescription = await insert('exercise_prescriptions', { session_id: session.id, block_id: index < 2 ? pair.id : single.id, position: index + 1, display_name: movement });
      checked(await admin.from('prescribed_sets').insert([1, 2, 3].map(position => ({ prescription_id: prescription.id, position, reps_min: 8, reps_max: 10, rir: 2, rest_seconds: 60 }))));
    }
  }
}
console.log('Fictional client journey ready: training@example.test');
console.log(`Development-only password: ${password}`);
