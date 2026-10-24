import type { Options, Sequelize } from 'sequelize';
type LocalDatabaseEnvironment = NodeJS.ProcessEnv & {
  DATABASE_HOST: string;
  DATABASE_PORT: string;
  DATABASE_USER: string;
  DATABASE_PASSWORD: string;
};
type LocalDatabaseConfiguration = Options & {
  host: string;
  port: number;
  username: string;
  password: string;
};
declare const databaseMaintenance: {
  assertTestDatabaseName(name: unknown): string;
  createTestDatabase(database: Pick<Sequelize, 'query'>, name: string): Promise<unknown>;
  dropTestDatabase(database: Pick<Sequelize, 'query'>, name: string): Promise<unknown>;
  mysqlMaintenanceConfiguration(environment?: NodeJS.ProcessEnv): Record<string, unknown>;
  testEnvironment(environment?: NodeJS.ProcessEnv): LocalDatabaseEnvironment;
  testDatabaseConfiguration<T extends Options = Options>(configuration?: T, environment?: NodeJS.ProcessEnv): T & LocalDatabaseConfiguration;
};
export = databaseMaintenance;
