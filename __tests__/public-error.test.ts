import assert from 'node:assert/strict';
import { test } from 'node:test';
import { publicFailure } from '../lib/api/public-error';
import { sendError } from '../lib/api/response';
import type { NextApiResponse } from 'next';
test('public errors hide deployment details in messages and nested errors', () => {
  for (const message of [
    'Set OPENAI_API_KEY to enable transcription, scripts and narration.',
    'Configure credentials for video.',
    'SQLSTATE: secret database failure',
    'upstream https://example.test/?token=private',
  ]) {
    let body: { message: string; data: { code: string; errors: string[] } };
    const res = {
      status: () => res,
      json: (value: typeof body) => {
        body = value;
        return res;
      },
    } as unknown as NextApiResponse;
    sendError(res, message, [message, 'raw stack at C:/server/secret.ts'], 503);
    assert.match(body!.data.code, /^6\d{5}$/);
    assert.equal(body!.message.includes(message), false);
    assert.deepEqual(body!.data.errors, [body!.message]);
    assert.doesNotMatch(JSON.stringify(body!), /OPENAI_API_KEY|secret.ts|token=private|SQLSTATE/);
  }
  assert.equal(publicFailure(503, 'Set OPENAI_API_KEY to enable transcription, scripts and narration.').code, '680001');
  assert.match(publicFailure(400, 'Error opening C:/private/credentials.json').code || '', /^6\d{5}$/);
  assert.equal(publicFailure(400, 'Choose a valid video range.').message, 'Choose a valid video range.');
});
