const SYSTEM_SCHEMAS = new Set(['mysql', 'information_schema', 'performance_schema', 'sys', 'ndbinfo']);

export function freshDatabaseName(name) {
  if (typeof name !== 'string' || !/^[a-z][a-z0-9_]{1,63}$/.test(name) || SYSTEM_SCHEMAS.has(name)) {
    throw new Error(
      'Set an explicit, valid application database name outside MySQL system schemas before provisioning.',
    );
  }
  return name;
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
