import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import { ApiError } from '../lib/api/response';

const APP = 'figur';
const COOKIE = `pm_fake_${APP}`;
const HOURS = 8;
const USER = Object.freeze({
  user_id: '1',
  email: `preview@${APP}.example.test`,
  full_name: 'Development Preview',
  avatar_url: '',
  plan: 'FREE' as const,
  subscription_status: 'ACTIVE' as const,
  onboarded_at: '2026-09-28T00:00:00.000Z',
  created_at: '2026-09-28T00:00:00.000Z',
  updated_at: '2026-09-28T00:00:00.000Z',
});
function local(req: NextApiRequest): boolean {
  if (process.env.NODE_ENV !== 'development') {
    return false;
  }
  try {
    const host = new URL(`http://${req.headers.host}`).hostname;
    const peer = req.socket.remoteAddress;
    return (
      ['localhost', '127.0.0.1', '[::1]'].includes(host) &&
      ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(peer || '')
    );
  } catch {
    return false;
  }
}
function sign(value: string): string {
  const state = globalThis as typeof globalThis & {
    __patchmanFakeSecrets?: Record<string, Buffer>;
  };
  state.__patchmanFakeSecrets ??= {};
  state.__patchmanFakeSecrets[APP] ??= randomBytes(32);
  return createHmac('sha256', state.__patchmanFakeSecrets[APP]).update(value).digest('hex');
}
export function readFakeUser(req: NextApiRequest) {
  if (!local(req)) {
    return null;
  }
  const cookie = req.cookies?.[COOKIE];
  if (!cookie || !/^[0-9]{13}\.[a-f0-9]{64}$/.test(cookie)) {
    return null;
  }
  const [deadline, signature] = cookie.split('.');
  if (Number(deadline) <= Date.now() || Number(deadline) > Date.now() + HOURS * 3600000) {
    return null;
  }
  if (!timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(sign(deadline), 'hex'))) {
    return null;
  }
  return USER;
}
export function fakeStatus(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (!local(req)) {
    throw new ApiError(404, 'Not found.');
  }
  return { user: readFakeUser(req), development: true };
}
function assertMutation(req: NextApiRequest, res: NextApiResponse) {
  fakeStatus(req, res);
  const origin = req.headers.origin;
  try {
    if (origin && new URL(origin).host === req.headers.host) {
      return;
    }
  } catch {
    /* Reject malformed origins. */
  }
  throw new ApiError(403, 'Use the local development app to change preview sign-in.');
}
export function fakeSignin(req: NextApiRequest, res: NextApiResponse) {
  assertMutation(req, res);
  const deadline = String(Date.now() + HOURS * 3600000);
  res.setHeader(
    'Set-Cookie',
    `${COOKIE}=${deadline}.${sign(deadline)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${HOURS * 3600}`,
  );
  return { user: USER, development: true };
}
export function fakeSignout(req: NextApiRequest, res: NextApiResponse) {
  assertMutation(req, res);
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`);
  return { user: null, development: true };
}
