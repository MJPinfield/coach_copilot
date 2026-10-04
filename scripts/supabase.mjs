import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function runtimeEnv() {
  const env = { ...process.env };
  if (!env.DOCKER_HOST) {
    const docker = spawnSync('docker', ['info'], { stdio: 'ignore', timeout: 10000 });
    if (docker.status !== 0) {
      const podman = spawnSync('podman', ['machine', 'inspect', '--format', '{{.ConnectionInfo.PodmanSocket.Path}}'], { encoding: 'utf8', timeout: 10000 });
      const socket = podman.stdout?.trim();
      if (podman.status === 0 && socket) env.DOCKER_HOST = `unix://${socket}`;
    }
  }
  return env;
}

export const cli = fileURLToPath(new URL('../node_modules/.bin/supabase', import.meta.url));
export function localConfig() {
  const config = JSON.parse(execFileSync(cli, ['status', '-o', 'json'], { env: runtimeEnv(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
  const url = new URL(config.API_URL);
  if (!['127.0.0.1', 'localhost'].includes(url.hostname)) throw new Error('Backend tests and seeds require a local Supabase URL');
  return config;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const result = spawnSync(cli, args, { env: runtimeEnv(), stdio: 'inherit' });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}
