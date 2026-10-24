/** The Account origin is explicit and identical in browsers and backend clients. */
export function parseAccountOrigin(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }
  try {
    const url = new URL(value);
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== '/' ||
      (url.protocol !== 'https:' && !(local && url.protocol === 'http:'))
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}
export function accountOrigin(): string {
  const origin = parseAccountOrigin(process.env.NEXT_PUBLIC_ACCOUNT_URL);
  if (!origin) {
    throw new Error('Patchman Account is not connected. Please reload or contact support.');
  }
  return origin;
}
