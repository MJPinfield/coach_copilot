import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { randomUUID } from 'node:crypto';
import { clients, seed, checked, fixture, password } from '../../tooling/seed-backend.mjs';

const { admin } = clients();
test.beforeAll(async () => { await seed(); });

async function account(withProgramme = true) {
  const id = randomUUID();
  const email = `workout-${id}@example.test`;
  checked(await admin.auth.admin.createUser({ id, email, password, email_confirm: true, user_metadata: { display_name: 'Training client' } }));
  const insert = async (table, values) => checked(await admin.from(table).insert(values).select().single());
  const relationship = await insert('coach_clients', { coach_id: fixture.coach, client_id: id, status: 'active' });
  if (withProgramme) {
    const programme = await insert('programmes', { relationship_id: relationship.id, name: 'Strength foundations', status: 'published' });
    const week = await insert('programme_weeks', { programme_id: programme.id, position: 1, name: 'Week 1' });
    const session = await insert('sessions', { week_id: week.id, position: 1, name: 'Upper body', notes: 'Choose the equipment that is free.' });
    const pair = await insert('session_blocks', { session_id: session.id, kind: 'superset', position: 1, label: 'A', rest_after_round_seconds: 90 });
    const single = await insert('session_blocks', { session_id: session.id, kind: 'single', position: 2, label: 'B' });
    for (const [position, name, block] of [[1, 'Bench press', pair], [2, 'Bent-over row', pair], [3, 'Cable curl', single]]) {
      const exercise = await insert('exercise_prescriptions', { session_id: session.id, block_id: block.id, exercise_id: fixture.exercise, position, display_name: name });
      checked(await admin.from('prescribed_sets').insert([1, 2].map(position => ({ prescription_id: exercise.id, position, reps_min: 8, reps_max: 10, load_kg: 40, load_convention: 'total_external', rir: 2, rest_seconds: 60 }))));
    }
  }
  return { id, email };
}
async function signIn(page, user) {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill(user.email);
  await page.getByLabel(/^Password/).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your training', exact: true })).toBeVisible();
}
async function start(page) {
  await page.getByRole('link', { name: 'Choose a workout' }).click();
  await page.getByRole('button', { name: 'Start Upper body' }).click();
  await expect(page.getByRole('heading', { name: 'Upper body', exact: true, level: 1 })).toBeVisible();
  return page.url().split('/workouts/')[1].split('?')[0];
}
const set = (page, name = 'Bench press', number = 1) => page.getByRole('region', { name: `${name} set ${number}`, exact: true });

test('login, select, switch around equipment, save, reload and finish against Supabase', async ({ page }) => {
  const user = await account();
  await signIn(page, user);
  const id = await start(page);
  await set(page).getByLabel('Load (kg)', { exact: true }).fill('45');
  await set(page).getByLabel('Reps', { exact: true }).fill('9');
  await set(page).getByRole('button', { name: 'Record set 1' }).click();
  await expect(page.getByText('Saved to your account', { exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'Exercise or superset', exact: true }).click();
  await page.getByRole('option', { name: 'Cable curl (0/2)', exact: true }).click();
  await set(page, 'Cable curl').getByLabel('Reps', { exact: true }).fill('10');
  await set(page, 'Cable curl').getByRole('button', { name: 'Record set 1' }).click();
  await expect(page.getByText('Saved to your account', { exact: true })).toBeVisible();
  await page.reload();
  await expect(set(page, 'Cable curl').getByLabel('Reps', { exact: true })).toHaveValue('10');
  await page.getByRole('combobox', { name: 'Exercise or superset', exact: true }).click();
  await page.getByRole('option', { name: 'Superset: Bench press + Bent-over row (1/4)', exact: true }).click();
  await expect(set(page).getByLabel('Reps', { exact: true })).toHaveValue('9');
  await expect(set(page).getByLabel('Load (kg)', { exact: true })).toHaveValue('45');
  await page.getByRole('link', { name: 'Back to your training' }).click();
  await page.getByRole('link', { name: 'Resume workout' }).click();
  await expect(set(page).getByLabel('Reps', { exact: true })).toHaveValue('9');
  await expect(page.getByText('Rest 90 seconds after the complete round.')).toHaveCount(1);
  await expect(set(page, 'Bent-over row').getByLabel('Reps', { exact: true })).toHaveValue('');
  await page.getByRole('button', { name: 'Next round' }).click();
  await expect(set(page, 'Bench press', 2).getByLabel('Reps', { exact: true })).toHaveValue('');
  await page.reload();
  await expect(set(page, 'Bench press', 2).getByLabel('Reps', { exact: true })).toHaveValue('');
  await page.getByRole('combobox', { name: 'Round', exact: true }).click();
  await page.getByRole('option', { name: 'Round 1 · 1/2 recorded', exact: true }).click();
  await expect(set(page).getByLabel('Reps', { exact: true })).toHaveValue('9');
  await page.getByRole('button', { name: 'Finish workout', exact: true }).click();
  await page.getByRole('button', { name: 'Keep training' }).click();
  await expect(page.getByRole('button', { name: 'Finish workout', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Finish workout', exact: true }).click();
  await page.getByRole('button', { name: 'Finish and save' }).click();
  await expect(page.getByText('Workout finished. Your recorded results are below.')).toBeVisible();
  const workout = checked(await admin.from('workouts').select('status').eq('id', id).single());
  expect(workout.status).toBe('completed');
  const exercises = checked(await admin.from('workout_exercises').select('performed_name, logged_sets(*)').eq('workout_id', id));
  expect(exercises.find(e => e.performed_name === 'Bench press').logged_sets.find(s => s.position === 1)).toMatchObject({ load_kg: 45, reps: 9, completed: true, load_convention: 'unknown' });
  expect(exercises.find(e => e.performed_name === 'Bent-over row').logged_sets.find(s => s.position === 1)).toMatchObject({ load_kg: null, reps: null, completed: false });
  await page.reload();
  await expect(page.getByRole('button', { name: 'Finish workout', exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const scan = await new AxeBuilder({ page }).analyze();
  expect(scan.violations).toEqual([]);
});

test('offline edits survive a full reload and sync after reconnection', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Offline service-worker navigation covered in Chromium; logging runs across all browsers.');
  await signIn(page, await account());
  const id = await start(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Upper body', exact: true })).toBeVisible();
  await context.setOffline(true);
  await set(page).getByLabel('Reps', { exact: true }).fill('7');
  await set(page).getByRole('button', { name: 'Record set 1' }).click();
  await expect(page.getByText('Offline · saved on device', { exact: true })).toBeVisible();
  await page.reload();
  await expect(set(page).getByLabel('Reps', { exact: true })).toHaveValue('7');
  await context.setOffline(false);
  await expect(page.getByText('Saved to your account', { exact: true })).toBeVisible();
  const exercises = checked(await admin.from('workout_exercises').select('logged_sets(*)').eq('workout_id', id).eq('performed_name', 'Bench press').single());
  expect(exercises.logged_sets.find(s => s.position === 1)).toMatchObject({ reps: 7, completed: true });
});

test.describe('save request failures', () => {
test.use({ serviceWorkers: 'block' });
test('failed save retains values and supports retry', async ({ page }) => {
  await signIn(page, await account());
  await start(page);
  await page.route('**/rest/v1/rpc/save_workout', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Temporarily unavailable' }) }));
  await set(page).getByLabel('Reps', { exact: true }).fill('6');
  await expect(page.getByText('Your latest changes have not synced')).toBeVisible();
  await page.reload();
  await expect(set(page).getByLabel('Reps', { exact: true })).toHaveValue('6');
  await expect(page.getByText('Your latest changes have not synced')).toBeVisible();
  await page.unroute('**/rest/v1/rpc/save_workout');
  await page.getByRole('button', { name: 'Retry save' }).click();
  await expect(page.getByText('Saved to your account', { exact: true })).toBeVisible();
});
});

test('bad credentials, empty programme and sign-out have recovery paths', async ({ page }) => {
  const user = await account(false);
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill(user.email);
  await page.getByLabel(/^Password/).fill('wrong-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Could not sign in');
  await page.getByLabel(/^Password/).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByRole('link', { name: 'Choose a workout' }).click();
  await expect(page.getByText('No programme shared yet')).toBeVisible();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/workouts');
  await expect(page).toHaveURL(/\/login$/);
});
