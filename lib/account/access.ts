import type { NextApiRequest } from 'next';
import { readFakeUser } from '../../FakeSignin/server';
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
  const fake = readFakeUser(req);
  if (fake) {
    return {
      access: true,
      app: APP_ID,
      preview: true,
      subscription_active: false,
      user: { ...fake, id: fake.user_id },
    };
  }
  const authorization = req.headers.authorization;
  const token = authorization
    ? /^Bearer [a-f0-9]{64}$/.test(authorization)
      ? authorization.slice(7)
      : ''
    : req.cookies?.pm_account_session;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    throw new ApiError(401, 'Sign in through Patchman Account.');
  }
  const base = new URL(process.env.ACCOUNT_API_URL || 'http://localhost:3001');
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
    throw new ApiError(401, 'Sign in through Patchman Account.');
  }
  if (response.status === 403) {
    throw new ApiError(403, 'Complete your profile in Patchman Account.');
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
