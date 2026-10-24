import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { connect, createServer } from 'node:tls';
import { databaseTls } from '../../lib/database/tls.cjs';

export async function verifyTlsHandshake() {
  const base = path.resolve('__tests__/.artifacts');
  await mkdir(base, { recursive: true });
  const directory = await mkdtemp(path.join(base, 'tls-handshake-'));
  const openssl =
    process.platform === 'win32' && existsSync('C:/Program Files/Git/usr/bin/openssl.exe')
      ? 'C:/Program Files/Git/usr/bin/openssl.exe'
      : 'openssl';
  const run = (args) => {
    const result = spawnSync(openssl, args, { cwd: directory, stdio: 'ignore', windowsHide: true, timeout: 15000 });
    assert.equal(result.status, 0, 'OpenSSL must generate the isolated TLS certificates.');
  };
  const sockets = new Set();
  let server;
  try {
    run([
      'req',
      '-x509',
      '-newkey',
      'ec',
      '-pkeyopt',
      'ec_paramgen_curve:prime256v1',
      '-nodes',
      '-keyout',
      'ca.key',
      '-out',
      'ca.pem',
      '-days',
      '2',
      '-subj',
      '/CN=Patchman test CA',
      '-addext',
      'basicConstraints=critical,CA:TRUE',
    ]);
    run([
      'req',
      '-new',
      '-newkey',
      'ec',
      '-pkeyopt',
      'ec_paramgen_curve:prime256v1',
      '-nodes',
      '-keyout',
      'leaf.key',
      '-out',
      'leaf.csr',
      '-subj',
      '/CN=localhost',
    ]);
    await writeFile(
      path.join(directory, 'extensions.cnf'),
      'subjectAltName=DNS:localhost\nbasicConstraints=critical,CA:FALSE\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth\n',
    );
    run([
      'x509',
      '-req',
      '-in',
      'leaf.csr',
      '-CA',
      'ca.pem',
      '-CAkey',
      'ca.key',
      '-CAcreateserial',
      '-out',
      'leaf.pem',
      '-days',
      '2',
      '-extfile',
      'extensions.cnf',
    ]);
    const ca = await readFile(path.join(directory, 'ca.pem'), 'utf8');
    server = createServer(
      {
        key: await readFile(path.join(directory, 'leaf.key')),
        cert: await readFile(path.join(directory, 'leaf.pem')),
        minVersion: 'TLSv1.2',
      },
      (socket) => socket.end(),
    );
    server.on('connection', (socket) => {
      sockets.add(socket);
      socket.on('close', () => sockets.delete(socket));
    });
    server.on('tlsClientError', () => {});
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, 'localhost', resolve);
    });
    const port = server.address().port;
    const handshake = (ssl, servername) =>
      new Promise((resolve, reject) => {
        const socket = connect({ ...ssl, host: 'localhost', port, servername });
        socket.setTimeout(3000, () => socket.destroy(new Error('TLS fixture timed out.')));
        socket.once('secureConnect', () => {
          const accepted = socket.authorized;
          socket.end();
          resolve(accepted);
        });
        socket.once('error', reject);
      });
    const configured = databaseTls({
      DATABASE_TLS_MODE: 'verify-full',
      DATABASE_HOST: 'localhost',
      DATABASE_TLS_CA: ca,
    }).ssl;
    assert.equal(await handshake(configured, 'localhost'), true);
    await assert.rejects(
      handshake(configured, 'different.example.test'),
      (error) => error.code === 'ERR_TLS_CERT_ALTNAME_INVALID',
    );
    await assert.rejects(
      handshake(databaseTls({ DATABASE_TLS_MODE: 'verify-full', DATABASE_HOST: 'localhost' }).ssl, 'localhost'),
      (error) =>
        ['UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'SELF_SIGNED_CERT_IN_CHAIN', 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY'].includes(
          error.code,
        ),
    );
    const leaf = await readFile(path.join(directory, 'leaf.pem'), 'utf8');
    assert.throws(
      () => databaseTls({ DATABASE_TLS_MODE: 'verify-full', DATABASE_HOST: 'localhost', DATABASE_TLS_CA: leaf }),
      /certificate-authority/,
    );
  } finally {
    for (const socket of sockets) {
      socket.destroy();
    }
    if (server?.listening) {
      await new Promise((resolve) => server.close(resolve));
    }
    assert(directory.startsWith(base + path.sep));
    await rm(directory, { recursive: true, force: true });
  }
}
