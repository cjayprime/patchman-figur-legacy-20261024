/** Server-only session transport. Every app in an environment must use the same cookie name. */
export interface AccountSessionRequest {
  headers: { authorization?: string | string[] };
  cookies?: Partial<Record<string, string>>;
}

export function accountSessionCookieName(): string {
  const configured = process.env.ACCOUNT_SESSION_COOKIE_NAME;
  const name = configured === undefined || configured === '' ? 'pm_account_session' : configured;
  if (!/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(name)) {
    throw new Error(
      'ACCOUNT_SESSION_COOKIE_NAME must start with a letter and contain at most 64 letters, digits, underscores or hyphens.',
    );
  }
  return name;
}

export function accountSessionToken(req?: AccountSessionRequest): string | undefined {
  const cookieName = accountSessionCookieName();
  const authorization = req?.headers.authorization;
  // An explicitly supplied, invalid Authorization never falls back to a cookie.
  const token =
    authorization !== undefined
      ? typeof authorization === 'string' && /^Bearer [a-f0-9]{64}$/.test(authorization)
        ? authorization.slice(7)
        : undefined
      : req?.cookies?.[cookieName];
  return typeof token === 'string' && /^[a-f0-9]{64}$/.test(token) ? token : undefined;
}

export function accountSessionAuthorization(req?: AccountSessionRequest): string {
  const token = accountSessionToken(req);
  return token ? `Bearer ${token}` : '';
}
