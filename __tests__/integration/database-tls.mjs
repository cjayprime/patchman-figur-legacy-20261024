import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { Sequelize } from 'sequelize';

process.env.DATABASE_TLS_MODE = 'disabled';
process.env.DATABASE_TLS_CA = '';
process.env.DATABASE_TLS_CA_FILE = '';
process.env.DATABASE_MAX_CONNECTIONS = '1';
process.env.DATABASE_WORKER_COUNT = '0';
process.env.DATABASE_PROCESS_ROLE = 'maintenance';
const require = createRequire(import.meta.url);
const settings = require('../../lib/database/config.cjs').test;
assert(
  ['localhost', '127.0.0.1', '::1'].includes(settings.host),
  'Read-only TLS compatibility checks require local MySQL.',
);
assert.equal(settings.dialectOptions.ssl, undefined);
const cli = new Sequelize({ ...settings, logging: false });
try {
  const [rows] = await cli.query('SELECT 1 AS healthy');
  assert.equal(rows[0].healthy, 1);
} finally {
  await cli.close();
}
const { sequelize } = await import('../../lib/sequelize.ts');
try {
  assert.equal(sequelize.options.dialectOptions.ssl, undefined);
  const [rows] = await sequelize.query('SELECT 1 AS healthy');
  assert.equal(rows[0].healthy, 1);
} finally {
  await sequelize.close();
}
console.log(
  'PASS: runtime and migration clients connect to local native MySQL with explicit disabled TLS, one connection each in sequence; only SELECT 1 was issued.',
);
