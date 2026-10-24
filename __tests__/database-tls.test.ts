import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { databaseTls } from '../lib/database/tls.cjs';
import { verifyTlsHandshake } from './helpers/tls-handshake.mjs';

test('remote TLS accepts trusted matching certificates and rejects untrusted or mismatched chains', verifyTlsHandshake);

test('only explicit localhost and loopback addresses select plaintext transport', () => {
  for (const host of [
    'localhost',
    'LOCALHOST',
    'localhost.',
    '127.0.0.1',
    '127.15.9.3',
    '::1',
    '0:0:0:0:0:0:0:1',
    '::ffff:127.0.0.1',
  ]) {
    assert.deepEqual(databaseTls({ DATABASE_HOST: host }), {});
  }
});

test('remote DNS names automatically require verified TLS using Node trust', () => {
  for (const host of ['db.example.test', 'db.internal', 'db', '127.0.0.1.example.test', 'db.example.test.']) {
    assert.deepEqual(databaseTls({ DATABASE_HOST: host }), {
      ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true, verifyIdentity: true },
    });
  }
});

test('invalid hosts and remote numeric addresses fail before connecting without leaking input', () => {
  for (const host of [
    undefined,
    '',
    ' localhost ',
    'db.example.test:3306',
    'https://db.example.test',
    'db..test',
    '-db.test',
    'db-.test',
    `${'x'.repeat(64)}.test`,
    '/private/operator/mysql.sock',
    '[::1]',
  ]) {
    assert.throws(
      () => databaseTls({ DATABASE_HOST: host }),
      (error: Error) => /Database TLS configuration/.test(error.message) && !error.message.includes('operator'),
    );
  }
  for (const host of ['192.0.2.1', '10.0.0.8', '2001:db8::1', '::ffff:192.0.2.1']) {
    assert.throws(() => databaseTls({ DATABASE_HOST: host }), /provider certificate DNS hostname/);
  }
});

test('remote certificate verification cannot be globally disabled', () => {
  assert.throws(
    () => databaseTls({ DATABASE_HOST: 'db.example.test', NODE_TLS_REJECT_UNAUTHORIZED: '0' }),
    /verification cannot be disabled/,
  );
});

test('runtime Sequelize and migration clients use the same standalone transport helper', async () => {
  const runtime = await readFile('lib/sequelize.ts', 'utf8');
  const cli = await readFile('lib/database/config.cjs', 'utf8');
  assert.match(runtime, /databaseTls\(\)/);
  assert.match(cli, /databaseTls\(\)/);
  assert.match(runtime, /database\/tls\.cjs/);
  assert.match(cli, /require\('\.\/tls\.cjs'\)/);
});
