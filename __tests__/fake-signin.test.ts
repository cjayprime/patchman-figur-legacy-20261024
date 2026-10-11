import test from 'node:test';
import assert from 'node:assert/strict';
import type { NextApiRequest, NextApiResponse } from 'next';
import { fakeSignin, fakeSignout, fakeStatus, readFakeUser } from '../FakeSignin/server';

test('FakeSignin is explicit, local, signed, reversible, and impossible in production', () => {
  const environment = process.env.NODE_ENV;
  const headers: Record<string, string> = {};
  const req = {
    headers: { host: 'localhost:3591', origin: 'http://localhost:3591' },
    cookies: {},
    socket: { remoteAddress: '127.0.0.1' },
  } as unknown as NextApiRequest;
  const res = {
    setHeader: (key: string, value: string) => {
      headers[key] = value;
    },
  } as unknown as NextApiResponse;
  try {
    Object.assign(process.env, { NODE_ENV: 'development' });
    assert.equal(readFakeUser(req), null);
    const signed = fakeSignin(req, res);
    assert.equal('id' in signed.user, false);
    assert.equal(signed.user.user_id, '1');
    assert.ok(signed.user.onboarded_at);
    assert.match(headers['Set-Cookie'], /HttpOnly; SameSite=Strict/);
    const [name, value] = headers['Set-Cookie'].split(';')[0].split('=');
    req.cookies[name] = value;
    assert.equal(readFakeUser(req)?.user_id, signed.user.user_id);
    req.cookies[name] = value.slice(0, -1) + (value.endsWith('0') ? '1' : '0');
    assert.equal(readFakeUser(req), null);
    req.cookies[name] = value;
    req.headers.origin = 'https://unrelated.example';
    assert.throws(() => fakeSignin(req, res), { statusCode: 403 });
    req.headers.origin = 'http://localhost:3591';
    fakeSignout(req, res);
    assert.match(headers['Set-Cookie'], /Max-Age=0/);
    const remote = {
      ...req,
      socket: { remoteAddress: '192.0.2.1' },
    } as unknown as NextApiRequest;
    assert.equal(readFakeUser(remote), null);
    assert.throws(() => fakeSignin(remote, res), { statusCode: 404 });
    for (const mode of ['production', 'test']) {
      Object.assign(process.env, { NODE_ENV: mode });
      assert.equal(readFakeUser(req), null);
      assert.throws(() => fakeStatus(req, res), { statusCode: 404 });
      assert.throws(() => fakeSignin(req, res), { statusCode: 404 });
      assert.throws(() => fakeSignout(req, res), { statusCode: 404 });
    }
  } finally {
    if (environment === undefined) {
      Reflect.deleteProperty(process.env, 'NODE_ENV');
    } else {
      Object.assign(process.env, { NODE_ENV: environment });
    }
  }
});
