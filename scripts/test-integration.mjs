import { spawnSync } from 'node:child_process';
if (!process.env.TEST_REDIS_URL) {
  console.error('TEST_REDIS_URL es obligatorio. Usa una instancia Redis local y desechable (ver README).');
  process.exit(1);
}
const result = spawnSync(process.execPath, ['node_modules/vitest/vitest.mjs', 'run'], { stdio: 'inherit', env: process.env });
process.exit(result.status ?? 1);
