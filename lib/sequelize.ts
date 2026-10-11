import { Sequelize } from 'sequelize';

export const sequelize = new Sequelize({
  database: process.env.DATABASE_NAME || 'patchman_figur',
  dialect: 'mysql',
  host: process.env.DATABASE_HOST || '127.0.0.1',
  logging: false,
  password: process.env.DATABASE_PASSWORD || '',
  port: Number(process.env.DATABASE_PORT || 3306),
  username: process.env.DATABASE_USER || 'root',
});
