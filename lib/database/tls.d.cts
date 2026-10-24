export interface DatabaseTlsOptions {
  ssl?: { ca?: string[]; minVersion: 'TLSv1.2'; rejectUnauthorized: true; verifyIdentity: true };
}
export function databaseTls(env?: Record<string, string | undefined>): DatabaseTlsOptions;
