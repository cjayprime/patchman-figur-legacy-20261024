import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { databaseName } = require('../lib/database/name.cjs');

test('database names must be explicit, safe application schemas and retain their exact spelling', () => {
  for (const value of [
    undefined,
    null,
    '',
    ' ',
    ' mysql',
    'mysql',
    'MYSQL',
    'sys',
    'information_schema',
    'performance_schema',
    'ndbinfo',
    'app-name',
    '../app',
    'app;DROP DATABASE mysql',
    'app\`name',
    '1app',
    'a'.repeat(65),
  ]) {
    assert.throws(() => databaseName(value), /Set DATABASE_NAME to an explicit, valid application database name/);
  }
  for (const value of [
    'patchman_account',
    'patchman_test_app_fixture_123',
    'Patchman_App',
    'x',
    '_app',
    'a'.repeat(64),
  ]) {
    assert.equal(databaseName(value), value);
  }
});

test('actual CLI configuration fails on missing or unsafe schema names without selecting a fallback', async () => {
  const base = path.resolve(tmpdir());
  const directory = await mkdtemp(path.join(base, 'patchman-db-name-'));
  const config = fileURLToPath(new URL('../lib/database/config.cjs', import.meta.url));
  const script = [
    "const assert = require('node:assert/strict');",
    'const config = process.argv[1];',
    "for (const name of [undefined, '', '../unsafe', 'mysql']) {",
    '  if (name === undefined) delete process.env.DATABASE_NAME;',
    '  else process.env.DATABASE_NAME = name;',
    '  delete require.cache[require.resolve(config)];',
    '  assert.throws(() => require(config), /Set DATABASE_NAME to an explicit, valid application database name/);',
    '}',
  ].join('\n');
  const inherited = Object.fromEntries(
    Object.entries(process.env).filter(([key]) =>
      ['path', 'pathext', 'systemroot', 'systemdrive', 'windir', 'comspec', 'temp', 'tmp', 'userprofile'].includes(
        key.toLowerCase(),
      ),
    ),
  );
  try {
    execFileSync(process.execPath, ['-e', script, config], {
      cwd: directory,
      env: {
        ...inherited,
        NODE_ENV: 'production',
        DATABASE_HOST: '127.0.0.1',
        DATABASE_PORT: '3306',
        DATABASE_USER: 'not_used',
        DATABASE_PASSWORD: '',
      },
      stdio: 'pipe',
      windowsHide: true,
    });
  } finally {
    assert.equal(path.dirname(directory), base);
    assert(path.basename(directory).startsWith('patchman-db-name-'));
    await rm(directory, { recursive: true, force: true });
  }
});
