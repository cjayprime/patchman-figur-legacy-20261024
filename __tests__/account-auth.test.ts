import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { NextApiRequest } from 'next';
import { requireAppAccess } from '../lib/account/access';
test('unsigned identities and retired preview cookies never authorize access', async () => {
  for (const cookies of [{}, { pm_fake_figur: '9999999999999.forged', harness_dev_session: 'forged', user_id: '1' }]) {
    const request = {
      headers: {},
      cookies,
      query: { user_id: '1' },
      socket: { remoteAddress: '127.0.0.1' },
    } as unknown as NextApiRequest;
    await assert.rejects(
      () => requireAppAccess(request),
      (error: unknown) => {
        assert.equal(
          (error as { statusCode?: number; status?: number }).statusCode ?? (error as { status?: number }).status,
          401,
        );
        return true;
      },
    );
  }
});
