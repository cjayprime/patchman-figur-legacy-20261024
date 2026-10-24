import assert from 'node:assert/strict';
import { test } from 'node:test';
import { identifier } from '../lib/projects/identifiers';
test('relational identifiers retain every unsigned BIGINT digit', () => {
  for (const value of ['1', '9007199254740993', '18446744073709551615']) {
    assert.equal(identifier(value), value);
  }
  for (const value of [
    1,
    9007199254740992,
    1n,
    '',
    '0',
    '01',
    '-1',
    '1.0',
    ' 1',
    '18446744073709551616',
    'project-id',
  ]) {
    assert.throws(() => identifier(value), { statusCode: 400 });
  }
});
