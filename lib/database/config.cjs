'use strict';

require('@next/env').loadEnvConfig(process.cwd());

const environment = {
  dialect: 'mysql',
  host: process.env.DATABASE_HOST || '127.0.0.1',
  port: Number(process.env.DATABASE_PORT || 3306),
  username: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'patchman_figur',
  migrationStorageTableName: 'sequelize_meta',
};

module.exports = { development: environment, test: environment, production: environment };
