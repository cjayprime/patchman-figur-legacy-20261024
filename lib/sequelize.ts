import { databaseName } from './database/name.cjs';
import { databaseInstance, databasePool } from './database/pool.cjs';
import { databaseTls } from './database/tls.cjs';
import { Sequelize } from 'sequelize';
import mysql2 from 'mysql2';

export const sequelize = databaseInstance(
  'figur',
  () =>
    new Sequelize({
      database: databaseName(process.env.DATABASE_NAME),
      dialect: 'mysql',
      dialectModule: mysql2,
      dialectOptions: { bigNumberStrings: true, supportBigNumbers: true, ...databaseTls() },
      host: process.env.DATABASE_HOST || '127.0.0.1',
      logging: false,
      password: process.env.DATABASE_PASSWORD || '',
      pool: databasePool(),
      port: Number(process.env.DATABASE_PORT || 3306),
      username: process.env.DATABASE_USER || 'root',
    }),
);
