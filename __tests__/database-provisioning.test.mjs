import assert from 'node:assert/strict';
import test from 'node:test';
import { createFreshDatabase, freshDatabaseName } from '../scripts/database-provisioning.mjs';

test('fresh provisioning rejects missing, unsafe and system schemas before connecting', async () => {
  let connections = 0;
  class ForbiddenConnection {
    constructor() {
      connections += 1;
      throw new Error('Must not connect');
    }
  }
  for (const name of [
    undefined,
    '',
    'mysql',
    'information_schema',
    'performance_schema',
    'sys',
    'ndbinfo',
    'MYSQL',
    'app;DROP DATABASE mysql',
    'app`name',
    '../app',
    'a'.repeat(65),
  ]) {
    await assert.rejects(
      createFreshDatabase({}, name, ForbiddenConnection),
      /explicit, valid application database name/,
    );
  }
  assert.equal(connections, 0);
  assert.equal(freshDatabaseName('patchman_disposable_123'), 'patchman_disposable_123');
});

test('provisioning selects no system database and creates only the configured quoted schema', async () => {
  const ssl = { rejectUnauthorized: true, verifyIdentity: true };
  const configuration = {
    dialect: 'mysql',
    database: 'old_app_schema',
    host: 'database.example.test',
    port: 3306,
    username: 'schema_scoped_user',
    password: 'fixture-only',
    dialectOptions: { ssl },
    pool: { min: 2, max: 7, acquire: 30000 },
  };
  const queries = [];
  let options;
  let closed = 0;
  class Connection {
    constructor(value) {
      options = value;
    }
    async query(sql) {
      queries.push(sql);
    }
    async close() {
      closed += 1;
    }
  }
  await createFreshDatabase(configuration, 'patchman_fresh_123', Connection);
  assert.equal(options.database, undefined);
  assert.equal(options.username, configuration.username);
  assert.equal(options.password, configuration.password);
  assert.equal(options.dialectOptions.ssl, ssl);
  assert.equal(options.pool.max, 1);
  assert.equal(options.pool.min, 0);
  assert.equal(options.pool.acquire, 30000);
  assert.equal(options.logging, false);
  assert.deepEqual(queries, [
    'CREATE DATABASE IF NOT EXISTS `patchman_fresh_123` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
  ]);
  assert.equal(closed, 1);
  assert.equal(configuration.database, 'old_app_schema');
  assert.deepEqual(configuration.pool, { min: 2, max: 7, acquire: 30000 });
});

test('provisioning closes its one-connection pool on a denied or failed create', async () => {
  let closed = 0;
  class Connection {
    async query() {
      throw new Error('CREATE permission denied');
    }
    async close() {
      closed += 1;
    }
  }
  await assert.rejects(
    createFreshDatabase({ dialect: 'mysql' }, 'patchman_fresh_123', Connection),
    /permission denied/,
  );
  assert.equal(closed, 1);
});
