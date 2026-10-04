import { spawnSync } from 'node:child_process';
import { localConfig } from './supabase.mjs';

const config = localConfig();
const env = { ...process.env, VITE_SUPABASE_URL: config.API_URL, VITE_SUPABASE_PUBLISHABLE_KEY: config.PUBLISHABLE_KEY || config.ANON_KEY };
const run = (command, args) => {
  const result = spawnSync(command, args, { env, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
};
if (process.argv[2] === 'test') {
  run('npm', ['run', 'build']);
  run('npx', ['playwright', 'test', '--config', 'tests/playwright.client.config.ts', ...process.argv.slice(3)]);
} else run('npm', ['run', 'dev', '--', ...process.argv.slice(2)]);
