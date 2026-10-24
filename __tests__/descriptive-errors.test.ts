import assert from 'node:assert/strict';
import { test } from 'node:test';
import { publicFailure } from '../lib/api/public-error';

test('known failures explain the affected action alongside a stable support code', () => {
  const cases = ['Account service is unavailable. Try again shortly.'];
  for (const message of cases) {
    const result = publicFailure(503, message);
    assert.match(result.code || '', /^6\d{5}$/);
    assert.match(result.message, /Code 6\d{5}\.$/);
    assert.notEqual(result.message, publicFailure(503, 'unknown upstream failure').message);
    assert.doesNotMatch(result.message, /DEV-ONLY|SQLSTATE|[A-Z]+_[A-Z_]+/);
  }
  assert.match(publicFailure(503, cases[0]).message, /Patchman Account.*verify your access/);
});

test('untrusted provider details cannot masquerade as a reviewed explanation', () => {
  for (const message of [
    'Account service is unavailable. Try again shortly. SQLSTATE private',
    'Account service is unavailable. Try again shortly. token=private',
    'Set PROVIDER_API_KEY from C:/private/settings.json',
    'SQLSTATE: SELECT secret FROM users',
    'constructor',
    '__proto__',
  ]) {
    const result = publicFailure(503, message);
    assert.match(result.code || '', /^6\d{5}$/);
    assert.doesNotMatch(result.message, /SQLSTATE|PROVIDER_API_KEY|C:\/|token=private|secret|constructor|__proto__/);
    assert.notEqual(result.message, message);
  }
  assert.deepEqual(publicFailure(400, 'Choose a valid date before continuing.'), {
    code: undefined,
    message: 'Choose a valid date before continuing.',
  });
});
