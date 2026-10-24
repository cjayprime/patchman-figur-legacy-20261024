'use strict';
const { databaseTls } = require('../../lib/database/tls.cjs');
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const TEST_NAME =
  /^patchman_test_(?:account|dowe|figur|flux|fold|harness|hookboy|outpaint|repaint|veil|visualizer)_[a-z0-9_]+_[a-f0-9]+$/;

function testEnvironment(environment = process.env) {
  const selected = {
    ...environment,
    DATABASE_HOST: environment.DATABASE_HOST ?? 'localhost',
    DATABASE_PORT: environment.DATABASE_PORT ?? '3306',
  };
  for (const key of ['DATABASE_HOST', 'DATABASE_PORT', 'DATABASE_USER', 'DATABASE_PASSWORD']) {
    if (typeof selected[key] !== 'string' || (key !== 'DATABASE_PASSWORD' && !selected[key])) {
      throw new Error(
        'Configure DATABASE_HOST, DATABASE_PORT, DATABASE_USER and DATABASE_PASSWORD before running local database checks. Existing credentials are used; no database login is created.',
      );
    }
  }
  if (!LOCAL_HOSTS.has(selected.DATABASE_HOST)) {
    throw new Error('Disposable database checks require an explicitly configured loopback DATABASE_HOST.');
  }
  if (
    !/^[0-9]+$/.test(selected.DATABASE_PORT) ||
    Number(selected.DATABASE_PORT) < 1 ||
    Number(selected.DATABASE_PORT) > 65535
  ) {
    throw new Error('DATABASE_PORT must be a valid TCP port.');
  }
  if (/[\x00-\x1f\x7f]/.test(selected.DATABASE_USER) || selected.DATABASE_USER.length > 32) {
    throw new Error('DATABASE_USER must be a valid configured local database login.');
  }
  databaseTls(selected);
  return selected;
}

function testDatabaseConfiguration(configuration = {}, environment = process.env) {
  const selected = testEnvironment({
    ...environment,
    DATABASE_HOST: environment.DATABASE_HOST ?? configuration.host,
    DATABASE_PORT: environment.DATABASE_PORT ?? String(configuration.port ?? 3306),
    DATABASE_USER: environment.DATABASE_USER ?? configuration.username,
    DATABASE_PASSWORD: environment.DATABASE_PASSWORD ?? configuration.password,
  });
  // Only the disposable test process and its explicitly spawned fixture children inherit these settings.
  for (const key of ['DATABASE_HOST', 'DATABASE_PORT', 'DATABASE_USER', 'DATABASE_PASSWORD']) {
    process.env[key] = selected[key];
  }
  return {
    ...configuration,
    dialect: 'mysql',
    host: selected.DATABASE_HOST,
    port: Number(selected.DATABASE_PORT),
    username: selected.DATABASE_USER,
    password: selected.DATABASE_PASSWORD,
    logging: false,
    pool: { ...configuration.pool, min: 0, max: 1 },
    dialectOptions: { supportBigNumbers: true, bigNumberStrings: true, ...databaseTls(selected) },
  };
}

function mysqlMaintenanceConfiguration(environment = process.env) {
  const configuration = testDatabaseConfiguration({}, environment);
  return {
    host: configuration.host,
    port: configuration.port,
    user: configuration.username,
    password: configuration.password,
    ...configuration.dialectOptions,
  };
}

function assertTestDatabaseName(name) {
  if (typeof name !== 'string' || name.length > 64 || !TEST_NAME.test(name)) {
    throw new Error(
      'Refusing a database operation outside the explicitly generated patchman_test_<app>_<suite>_<unique> namespace.',
    );
  }
  return name;
}

function createTestDatabase(database, name) {
  return database.query(
    `CREATE DATABASE \`${assertTestDatabaseName(name)}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
}

function dropTestDatabase(database, name) {
  return database.query(`DROP DATABASE IF EXISTS \`${assertTestDatabaseName(name)}\``);
}

module.exports = {
  assertTestDatabaseName,
  createTestDatabase,
  dropTestDatabase,
  mysqlMaintenanceConfiguration,
  testEnvironment,
  testDatabaseConfiguration,
};
