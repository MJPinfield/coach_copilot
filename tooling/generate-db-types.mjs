import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { cli, runtimeEnv } from './supabase.mjs';

const types = execFileSync(cli, ['gen', 'types', 'typescript', '--local', '--schema', 'public'], {
  env: runtimeEnv(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], maxBuffer: 10 * 1024 * 1024,
}).replace(/[ \t]+$/gm, '');
if (!types.includes('export type Database')) throw new Error('Type generation did not return Database types');
const file = new URL('../src/backend/database.types.ts', import.meta.url);
if (process.argv.includes('--check')) {
  if (readFileSync(file, 'utf8') !== types) throw new Error('Database types are stale; run npm run backend:types');
  console.log('Generated database types match the migration schema.');
} else {
  writeFileSync(file, types);
}
