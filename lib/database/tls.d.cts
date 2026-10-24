export interface DatabaseTlsOptions {
  ssl?: { minVersion: 'TLSv1.2'; rejectUnauthorized: true; verifyIdentity: true };
}
export function databaseTls(env?: Record<string, string | undefined>): DatabaseTlsOptions;
