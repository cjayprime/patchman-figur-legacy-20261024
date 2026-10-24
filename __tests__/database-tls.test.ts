import assert from 'node:assert/strict';
import test from 'node:test';
import { X509Certificate } from 'node:crypto';
import { rootCertificates } from 'node:tls';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { databaseTls } from '../lib/database/tls.cjs';
import { verifyTlsHandshake } from './helpers/tls-handshake.mjs';

const ca = rootCertificates.find((pem) => {
  const value = new X509Certificate(pem);
  return value.ca && Date.parse(value.validFrom) <= Date.now() && Date.parse(value.validTo) > Date.now();
})!;
test(
  'real TLS accepts the configured CA and hostname, rejects mismatched hosts and untrusted chains',
  verifyTlsHandshake,
);
test('database TLS supports explicit local plaintext and verified system-root connections', () => {
  assert.deepEqual(databaseTls({}), {});
  assert.deepEqual(databaseTls({ DATABASE_TLS_MODE: 'disabled' }), {});
  assert.deepEqual(databaseTls({ DATABASE_TLS_MODE: 'verify-full', DATABASE_HOST: 'db.example.test' }), {
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true, verifyIdentity: true },
  });
});
test('custom CA bundles validate and support literal escaped newlines', () => {
  for (const material of [ca, ca.split('\n').join('\\n')]) {
    const result = databaseTls({
      DATABASE_TLS_MODE: 'verify-full',
      DATABASE_HOST: 'db.example.test',
      DATABASE_TLS_CA: material,
    });
    assert.equal(result.ssl?.rejectUnauthorized, true);
    assert.equal(result.ssl?.verifyIdentity, true);
    assert.equal(new X509Certificate(result.ssl!.ca![0]).fingerprint256, new X509Certificate(ca).fingerprint256);
  }
});
test('unsafe modes, identity bypasses, invalid CA and unexpected material fail before connecting', () => {
  for (const mode of ['required', 'prefer', 'true', 'false', 'verify-ca', 'VERIFY-FULL']) {
    assert.throws(() => databaseTls({ DATABASE_TLS_MODE: mode }), /Database TLS configuration/);
  }
  for (const host of [
    undefined,
    '',
    '127.0.0.1',
    '::1',
    'db.example.test:3306',
    'https://db.example.test',
    'db..test',
  ]) {
    assert.throws(() => databaseTls({ DATABASE_TLS_MODE: 'verify-full', DATABASE_HOST: host }), /DNS hostname/);
  }
  for (const unsafe of [
    { NODE_TLS_REJECT_UNAUTHORIZED: '0' },
    { DATABASE_TLS_REJECT_UNAUTHORIZED: 'false' },
    { DATABASE_TLS_VERIFY_IDENTITY: 'false' },
  ]) {
    assert.throws(() => databaseTls({ DATABASE_TLS_MODE: 'verify-full', ...unsafe }), /cannot be disabled/);
  }
  for (const material of [
    'not a CA',
    `${ca}\nprivate-unreviewed-text`,
    '-----BEGIN CERTIFICATE-----\nbad\n-----END CERTIFICATE-----',
    '-----BEGIN PRIVATE KEY-----\nprivate-material\n-----END PRIVATE KEY-----',
    'x'.repeat(262145),
  ]) {
    assert.throws(
      () =>
        databaseTls({ DATABASE_TLS_MODE: 'verify-full', DATABASE_HOST: 'db.example.test', DATABASE_TLS_CA: material }),
      (error: Error) => !error.message.includes('private-material') && /Database TLS configuration/.test(error.message),
    );
  }
  assert.throws(() => databaseTls({ DATABASE_TLS_CA: ca }), /Enable verify-full/);
  assert.throws(
    () =>
      databaseTls({
        DATABASE_TLS_MODE: 'verify-full',
        DATABASE_HOST: 'db.example.test',
        DATABASE_TLS_CA: ca,
        DATABASE_TLS_CA_FILE: 'private-path',
      }),
    /not both/,
  );
});
test('server CA files are validated without leaking private paths or contents', async () => {
  const base = path.resolve('__tests__/.artifacts');
  const { mkdir } = await import('node:fs/promises');
  await mkdir(base, { recursive: true });
  const directory = await mkdtemp(path.join(base, 'database-ca-'));
  try {
    const file = path.join(directory, 'root.pem');
    await writeFile(file, ca);
    const result = databaseTls({
      DATABASE_TLS_MODE: 'verify-full',
      DATABASE_HOST: 'db.example.test',
      DATABASE_TLS_CA_FILE: file,
    });
    assert.equal(result.ssl?.ca?.length, 1);
    await writeFile(file, 'invalid-private-certificate-material');
    assert.throws(
      () =>
        databaseTls({ DATABASE_TLS_MODE: 'verify-full', DATABASE_HOST: 'db.example.test', DATABASE_TLS_CA_FILE: file }),
      (error: Error) =>
        !error.message.includes(file) && !error.message.includes('invalid-private-certificate-material'),
    );
    assert.throws(
      () =>
        databaseTls({
          DATABASE_TLS_MODE: 'verify-full',
          DATABASE_HOST: 'db.example.test',
          DATABASE_TLS_CA_FILE: directory,
        }),
      /missing, unreadable or too large/,
    );
    assert.throws(
      () =>
        databaseTls({
          DATABASE_TLS_MODE: 'verify-full',
          DATABASE_HOST: 'db.example.test',
          DATABASE_TLS_CA_FILE: path.join(directory, 'absent.pem'),
        }),
      /missing, unreadable or too large/,
    );
  } finally {
    assert(directory.startsWith(base + path.sep));
    await rm(directory, { recursive: true, force: true });
  }
});
test('runtime Sequelize and migration clients use the same standalone TLS helper', async () => {
  const runtime = await readFile('lib/sequelize.ts', 'utf8');
  const cli = await readFile('lib/database/config.cjs', 'utf8');
  assert.match(runtime, /databaseTls\(\)/);
  assert.match(cli, /databaseTls\(\)/);
  assert.match(runtime, /database\/tls\.cjs/);
  assert.match(cli, /require\('\.\/tls\.cjs'\)/);
});
