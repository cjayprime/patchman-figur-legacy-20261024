import assert from 'node:assert/strict';
import test from 'node:test';
import maintenance from './helpers/database-maintenance.cjs';
const { assertTestDatabaseName, createTestDatabase, dropTestDatabase, testEnvironment, testDatabaseConfiguration } =
  maintenance;
const fixture = {
  DATABASE_HOST: '127.0.0.1',
  DATABASE_PORT: '3306',
  DATABASE_USER: 'configured_local_user',
  DATABASE_PASSWORD: 'fixture-only',
};

test('database checks use configured credentials without requiring another login', () => {
  const selected = testEnvironment(fixture);
  assert.equal(selected.DATABASE_USER, fixture.DATABASE_USER);
  assert.equal(selected.DATABASE_PASSWORD, fixture.DATABASE_PASSWORD);
  for (const missing of ['DATABASE_USER', 'DATABASE_PASSWORD']) {
    const env = { ...fixture };
    delete env[missing];
    assert.throws(() => testEnvironment(env), /Configure DATABASE_HOST/);
  }
  assert.throws(() => testDatabaseConfiguration({}, {}), /Configure DATABASE_HOST/);
  assert.doesNotThrow(() => testEnvironment({ ...fixture, DATABASE_PASSWORD: '' }));
  const defaults = testEnvironment({
    DATABASE_USER: fixture.DATABASE_USER,
    DATABASE_PASSWORD: fixture.DATABASE_PASSWORD,
  });
  assert.equal(defaults.DATABASE_HOST, 'localhost');
  assert.equal(defaults.DATABASE_PORT, '3306');
});

test('maintenance transport is explicitly local and rejects invalid configuration before connecting', () => {
  for (const host of ['db.production.example', '127.0.0.1.example', '']) {
    assert.throws(() => testEnvironment({ ...fixture, DATABASE_HOST: host }), /loopback|Configure/);
  }
  for (const port of ['0', '65536', '3306junk', '3.3', '-1']) {
    assert.throws(() => testEnvironment({ ...fixture, DATABASE_PORT: port }), /valid TCP port/);
  }
});

test('existing settings remain unchanged while the maintenance pool is limited to one', () => {
  const env = { ...fixture, DATABASE_NAME: 'patchman_test_figur_projects_123_456' };
  const selected = testEnvironment(env);
  assert.equal(selected.DATABASE_USER, fixture.DATABASE_USER);
  assert.equal(selected.DATABASE_PASSWORD, fixture.DATABASE_PASSWORD);
  assert.equal(selected.DATABASE_NAME, env.DATABASE_NAME);
  assert.equal(env.DATABASE_USER, fixture.DATABASE_USER);
  const before = { ...process.env };
  try {
    const config = testDatabaseConfiguration(
      {
        host: fixture.DATABASE_HOST,
        port: 3306,
        username: fixture.DATABASE_USER,
        password: fixture.DATABASE_PASSWORD,
        pool: { max: 7, min: 2 },
      },
      {},
    );
    assert.equal(config.pool.max, 1);
    assert.equal(config.pool.min, 0);
    assert.equal(config.username, fixture.DATABASE_USER);
    assert.equal(process.env.DATABASE_USER, fixture.DATABASE_USER);
    assert.deepEqual(config.dialectOptions, { supportBigNumbers: true, bigNumberStrings: true });
  } finally {
    for (const key of Object.keys(process.env)) {
      if (!(key in before)) {
        delete process.env[key];
      }
    }
    Object.assign(process.env, before);
  }
});

test('database creation and cleanup accept only guarded generated test names', async () => {
  const statements = [];
  const database = {
    async query(sql) {
      statements.push(sql);
    },
  };
  for (const name of [
    'mysql',
    'patchman_figur_v3',
    'patchman_test_figur_projects',
    'patchman_test_other_project_123',
    'patchman_test_figur_p_123`',
    'patchman_test_figur_p_123;DROP DATABASE mysql',
    `patchman_test_figur_${'x'.repeat(60)}_1`,
  ]) {
    assert.throws(() => createTestDatabase(database, name), /Refusing a database operation/);
    assert.throws(() => dropTestDatabase(database, name), /Refusing a database operation/);
  }
  assert.deepEqual(statements, []);
  for (const app of [
    'account',
    'dowe',
    'figur',
    'flux',
    'fold',
    'harness',
    'hookboy',
    'outpaint',
    'repaint',
    'veil',
    'visualizer',
  ]) {
    assert.equal(
      assertTestDatabaseName(`patchman_test_${app}_projects_123_456`),
      `patchman_test_${app}_projects_123_456`,
    );
  }
  await createTestDatabase(database, 'patchman_test_figur_projects_123_456');
  await dropTestDatabase(database, 'patchman_test_figur_projects_123_456');
  assert.deepEqual(statements, [
    'CREATE DATABASE `patchman_test_figur_projects_123_456` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
    'DROP DATABASE IF EXISTS `patchman_test_figur_projects_123_456`',
  ]);
});
