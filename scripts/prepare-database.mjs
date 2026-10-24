import './check-node.cjs';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('../', import.meta.url));
const env = { ...process.env, NODE_ENV: 'production' };
const cli = require.resolve('sequelize-cli/lib/sequelize');
let active;
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    active?.kill(signal);
    process.exitCode = 1;
  });
}
async function run(label, args) {
  console.log(`[database:prepare] ${label}`);
  const code = await new Promise((resolve, reject) => {
    active = spawn(process.execPath, args, { cwd: root, env, stdio: 'inherit', windowsHide: true });
    active.once('error', reject);
    active.once('exit', (status) => resolve(status ?? 1));
  });
  active = undefined;
  if (code !== 0 || process.exitCode) {
    process.exitCode = code || 1;
    throw new Error('Database preparation stopped; the build must not continue.');
  }
}
try {
  await run('Applying production migrations.', [
    cli,
    'db:migrate',
    '--config',
    'lib/database/config.cjs',
    '--migrations-path',
    'migrations',
    '--env',
    'production',
  ]);
  if (existsSync(new URL('./check-database.cjs', import.meta.url))) {
    await run('Verifying the application schema.', [
      fileURLToPath(new URL('./check-database.cjs', import.meta.url)),
      'production',
    ]);
  }
  await run('Applying production seeds.', [
    cli,
    'db:seed:all',
    '--config',
    'lib/database/config.cjs',
    '--seeders-path',
    'seeders',
    '--env',
    'production',
  ]);
} catch (error) {
  console.error(`[database:prepare] ${error.message}`);
  process.exitCode ||= 1;
}
