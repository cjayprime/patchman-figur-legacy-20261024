import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { Sequelize } from 'sequelize';

const require = createRequire(import.meta.url);
const { configureDatabaseProcess } = require('../../lib/database/pool.cjs');
configureDatabaseProcess({ role: 'maintenance' });
const settings = require('../../lib/database/config.cjs').test;
assert(
  ['localhost', '127.0.0.1', '::1'].includes(settings.host),
  'Read-only compatibility checks require explicitly configured local MySQL.',
);
assert.equal(settings.dialectOptions.ssl, undefined);
const cli = new Sequelize({ ...settings, logging: false });
try {
  const [rows] = await cli.query('SELECT 1 AS healthy');
  assert.equal(String(rows[0].healthy), '1');
} finally {
  await cli.close();
}
const { sequelize } = await import('../../lib/sequelize.ts');
try {
  assert.equal(sequelize.options.dialectOptions.ssl, undefined);
  const [rows] = await sequelize.query('SELECT 1 AS healthy');
  assert.equal(String(rows[0].healthy), '1');
} finally {
  await sequelize.close();
}
console.log(
  'PASS: CLI and runtime select loopback plaintext automatically and execute only SELECT 1 with sequential maintenance connections.',
);
