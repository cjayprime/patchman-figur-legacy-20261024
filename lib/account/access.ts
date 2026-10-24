import { accountOrigin } from './url';
import { accountSessionToken } from './session-token';
import type { NextApiRequest } from 'next';
import { ApiError } from '../api/response';
export interface AccountUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  onboarded_at: string | null;
  plan?: string;
}
export interface AccountAccess {
  user: AccountUser;
  app: string;
  access: boolean;
  subscription_active: boolean;
  preview: boolean;
}
const APP_ID = 'figur';
const pending = new WeakMap<NextApiRequest, Promise<AccountAccess>>();
async function verify(req: NextApiRequest): Promise<AccountAccess> {
  const token = accountSessionToken(req);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    throw new ApiError(401, 'Click the profile icon at the top right to sign in, then try again.');
  }
  const base = new URL(accountOrigin());
  if (base.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(base.hostname)) {
    throw new ApiError(503, 'Account requires HTTPS.');
  }
  const url = new URL('/api/subscription/status', base);
  url.searchParams.set('app', APP_ID);
  let response: Response;
  try {
    response = await fetch(url, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}` },
      redirect: 'error',
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new ApiError(503, 'Account service is unavailable. Try again shortly.');
  }
  if (response.status === 401) {
    throw new ApiError(401, 'Click the profile icon at the top right to sign in, then try again.');
  }
  if (response.status === 403) {
    throw new ApiError(403, 'Complete your profile in Patchman Account.');
  }
  if (response.status === 429) {
    const delay = Number(response.headers.get('Retry-After'));
    throw new ApiError(
      429,
      'Account access checks are temporarily busy. Keep your work open and try again shortly.',
      Number.isInteger(delay) && delay > 0 && delay <= 120 ? delay : 60,
    );
  }
  if (!response.ok) {
    throw new ApiError(503, 'Account could not verify your subscription.');
  }
  const body = await response.json();
  const value = body?.data;
  if (
    !body.status ||
    value?.app !== APP_ID ||
    typeof value?.user?.id !== 'string' ||
    !/^[1-9][0-9]{0,19}$/.test(value.user.id) ||
    BigInt(value.user.id) > 18446744073709551615n ||
    typeof value.access !== 'boolean' ||
    typeof value.subscription_active !== 'boolean' ||
    value.preview
  ) {
    throw new ApiError(503, 'Account returned an invalid subscription response.');
  }
  return value;
}
export function accountAccess(req: NextApiRequest) {
  let result = pending.get(req);
  if (!result) {
    result = verify(req);
    pending.set(req, result);
  }
  return result;
}
export async function requireAppAccess(req: NextApiRequest) {
  const result = await accountAccess(req);
  if (!result.user.onboarded_at) {
    throw new ApiError(403, 'Complete your profile in Patchman Account.');
  }
  if (!result.access) {
    throw new ApiError(402, 'Manage your subscription in Patchman Account to continue.');
  }
  return result.user;
}
