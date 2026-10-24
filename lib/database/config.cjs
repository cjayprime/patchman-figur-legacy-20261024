'use strict';

require('@next/env').loadEnvConfig(process.cwd());
const { databasePool } = require('./pool.cjs');
const { databaseTls } = require('./tls.cjs');

const environment = {
  pool: databasePool({ ...process.env, DATABASE_PROCESS_ROLE: 'maintenance' }),
  logging: false,
  dialect: 'mysql',
  dialectOptions: { supportBigNumbers: true, bigNumberStrings: true, ...databaseTls() },
  host: process.env.DATABASE_HOST || '127.0.0.1',
  port: Number(process.env.DATABASE_PORT || 3306),
  username: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'patchman_figur_v3',
  migrationStorageTableName: 'sequelize_meta',
};

module.exports = { development: environment, test: environment, production: environment };
