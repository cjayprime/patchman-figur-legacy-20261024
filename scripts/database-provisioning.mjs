import { databaseName } from '../lib/database/name.cjs';

export function freshDatabaseName(name) {
  return databaseName(name);
}

export async function createFreshDatabase(configuration, name, SequelizeConstructor) {
  const validated = freshDatabaseName(name);
  // A schema-scoped login must not need SELECT/USE access to mysql or any other database.
  const database = new SequelizeConstructor({
    ...configuration,
    database: undefined,
    logging: false,
    pool: { ...configuration.pool, min: 0, max: 1 },
  });
  try {
    await database.query(
      `CREATE DATABASE IF NOT EXISTS \`${validated}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
  } finally {
    await database.close();
  }
}
