import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  accountSessionAuthorization,
  accountSessionCookieName,
  accountSessionToken,
} from '../lib/account/session-token';

test('session cookies isolate environments and ignore other cookie names', () => {
  const previous = process.env.ACCOUNT_SESSION_COOKIE_NAME;
  const production = 'a'.repeat(64);
  const staging = 'b'.repeat(64);
  try {
    delete process.env.ACCOUNT_SESSION_COOKIE_NAME;
    assert.equal(accountSessionCookieName(), 'pm_account_session');
    assert.equal(accountSessionToken({ headers: {}, cookies: { pm_account_session: production } }), production);
    process.env.ACCOUNT_SESSION_COOKIE_NAME = 'pm_account_staging';
    assert.equal(accountSessionCookieName(), 'pm_account_staging');
    assert.equal(accountSessionToken({ headers: {}, cookies: { pm_account_session: production } }), undefined);
    assert.equal(
      accountSessionToken({ headers: {}, cookies: { pm_account_session: production, pm_account_staging: staging } }),
      staging,
    );
    assert.equal(
      accountSessionAuthorization({ headers: {}, cookies: { pm_account_staging: staging } }),
      `Bearer ${staging}`,
    );
    assert.equal(accountSessionToken({ headers: {}, cookies: { dowe_session: production } }), undefined);
    assert.equal(accountSessionToken({ headers: {}, cookies: { pm_account_staging: 'malformed' } }), undefined);
    assert.equal(accountSessionAuthorization(), '');
  } finally {
    if (previous === undefined) {
      delete process.env.ACCOUNT_SESSION_COOKIE_NAME;
    } else {
      process.env.ACCOUNT_SESSION_COOKIE_NAME = previous;
    }
  }
});

test('valid Bearer takes precedence and invalid explicit Authorization cannot use a cookie', () => {
  const previous = process.env.ACCOUNT_SESSION_COOKIE_NAME;
  const token = 'c'.repeat(64);
  const cookies = { pm_account_staging: 'd'.repeat(64) };
  process.env.ACCOUNT_SESSION_COOKIE_NAME = 'pm_account_staging';
  try {
    assert.equal(accountSessionToken({ headers: { authorization: `Bearer ${token}` }, cookies }), token);
    for (const authorization of [
      '',
      'Basic token',
      'Bearer ',
      'Bearer malformed',
      `bearer ${token}`,
      `Bearer ${token} `,
      `Bearer ${'A'.repeat(64)}`,
      [`Bearer ${token}`],
    ]) {
      assert.equal(accountSessionToken({ headers: { authorization }, cookies }), undefined);
      assert.equal(accountSessionAuthorization({ headers: { authorization }, cookies }), '');
    }
  } finally {
    if (previous === undefined) {
      delete process.env.ACCOUNT_SESSION_COOKIE_NAME;
    } else {
      process.env.ACCOUNT_SESSION_COOKIE_NAME = previous;
    }
  }
});

test('unsafe cookie configuration fails closed without reflecting the configured value', () => {
  const previous = process.env.ACCOUNT_SESSION_COOKIE_NAME;
  try {
    for (const value of [
      ' ',
      'bad; Path=/',
      'bad\r\nInjected: value',
      '1bad',
      'a'.repeat(65),
      '__Host-patchman',
      '__Secure-patchman',
    ]) {
      process.env.ACCOUNT_SESSION_COOKIE_NAME = value;
      assert.throws(
        () => accountSessionToken({ headers: { authorization: `Bearer ${'e'.repeat(64)}` } }),
        /ACCOUNT_SESSION_COOKIE_NAME/,
      );
    }
    process.env.ACCOUNT_SESSION_COOKIE_NAME = '';
    assert.equal(accountSessionCookieName(), 'pm_account_session');
  } finally {
    if (previous === undefined) {
      delete process.env.ACCOUNT_SESSION_COOKIE_NAME;
    } else {
      process.env.ACCOUNT_SESSION_COOKIE_NAME = previous;
    }
  }
});
