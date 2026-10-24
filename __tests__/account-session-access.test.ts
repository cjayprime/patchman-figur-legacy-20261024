import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { NextApiRequest } from 'next';
import { requireAppAccess as verifyIdentity } from '../lib/account/access';

test('the real host identity reader uses only its environment cookie and honors strict Bearer precedence', async () => {
  const previousName = process.env.ACCOUNT_SESSION_COOKIE_NAME;
  const previousUrl = process.env.NEXT_PUBLIC_ACCOUNT_URL;
  const previousFetch = globalThis.fetch;
  const staging = 'b'.repeat(64);
  const production = 'a'.repeat(64);
  let expectedToken = staging;
  let calls = 0;
  process.env.ACCOUNT_SESSION_COOKIE_NAME = 'pm_account_staging';
  process.env.NEXT_PUBLIC_ACCOUNT_URL = 'https://account.staging.example.test';
  globalThis.fetch = (async (input, init) => {
    calls++;
    const endpoint = new URL(String(input));
    assert.equal(endpoint.origin, 'https://account.staging.example.test');
    assert.equal(endpoint.pathname, '/api/subscription/status');
    assert.equal(endpoint.searchParams.get('app'), 'figur');
    assert.equal(new Headers(init?.headers).get('Authorization'), `Bearer ${expectedToken}`);
    assert.equal(new Headers(init?.headers).has('Cookie'), false);
    return Response.json({
      status: true,
      data: {
        app: 'figur',
        access: true,
        subscription_active: true,
        preview: false,
        user: {
          id: '9007199254740993',
          email: 'fixture@example.test',
          full_name: 'Fixture',
          onboarded_at: '2026-01-01',
        },
        limits: { connected_accounts: 10 },
        is_admin: false,
      },
    });
  }) as typeof fetch;
  const request = (headers = {}, cookies = { pm_account_staging: staging, pm_account_session: production }) =>
    ({ headers, cookies }) as unknown as NextApiRequest;
  try {
    const identity = await verifyIdentity(request());
    assert.equal('user_id' in identity ? identity.user_id : identity.id, '9007199254740993');
    assert.equal(calls, 1);
    await assert.rejects(verifyIdentity(request({}, { pm_account_session: production } as never)));
    assert.equal(calls, 1);
    for (const authorization of ['', 'Basic invalid', 'Bearer malformed']) {
      await assert.rejects(verifyIdentity(request({ authorization })));
    }
    assert.equal(calls, 1, 'invalid explicit authorization must not fall back to the staging cookie');
    expectedToken = production;
    await verifyIdentity(request({ authorization: `Bearer ${production}` }));
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousName === undefined) {
      delete process.env.ACCOUNT_SESSION_COOKIE_NAME;
    } else {
      process.env.ACCOUNT_SESSION_COOKIE_NAME = previousName;
    }
    if (previousUrl === undefined) {
      delete process.env.NEXT_PUBLIC_ACCOUNT_URL;
    } else {
      process.env.NEXT_PUBLIC_ACCOUNT_URL = previousUrl;
    }
  }
});
