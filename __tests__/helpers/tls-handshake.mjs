import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'node:tls';
import { fileURLToPath } from 'node:url';

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
    assert.equal(result.status, 0, 'OpenSSL must generate isolated TLS certificates.');
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
      '/CN=Patchman isolated test CA',
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
      '/CN=db.example.test',
    ]);
    await writeFile(
      path.join(directory, 'extensions.cnf'),
      'subjectAltName=DNS:db.example.test\nbasicConstraints=critical,CA:FALSE\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth\n',
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
      server.listen(0, '127.0.0.1', resolve);
    });
    const port = server.address().port;
    const helper = fileURLToPath(new URL('../../lib/database/tls.cjs', import.meta.url));
    const client = [
      "const tls = require('node:tls');",
      'const { databaseTls } = require(process.argv[1]);',
      "const options = databaseTls({ DATABASE_HOST: 'db.example.test' });",
      "const socket = tls.connect({ ...options.ssl, host: '127.0.0.1', port: Number(process.argv[2]), servername: process.argv[3] });",
      "socket.setTimeout(3000, () => socket.destroy(new Error('Fixture timeout')));",
      "socket.once('secureConnect', () => { console.log(JSON.stringify({ authorized: socket.authorized, protocol: socket.getProtocol() })); socket.end(); });",
      "socket.once('error', error => { console.log(JSON.stringify({ error: error.code || 'FIXTURE_ERROR' })); });",
    ].join('\n');
    const handshake = (servername, trusted) =>
      new Promise((resolve, reject) => {
        const env = { ...process.env };
        delete env.NODE_TLS_REJECT_UNAUTHORIZED;
        delete env.NODE_OPTIONS;
        if (trusted) {
          env.NODE_EXTRA_CA_CERTS = path.join(directory, 'ca.pem');
        } else {
          delete env.NODE_EXTRA_CA_CERTS;
        }
        const child = spawn(process.execPath, ['-e', client, helper, String(port), servername], {
          env,
          stdio: ['ignore', 'pipe', 'pipe'],
          windowsHide: true,
        });
        let output = '';
        child.stdout.on('data', (chunk) => (output += chunk));
        child.stderr.resume();
        child.once('error', reject);
        const timeout = setTimeout(() => {
          child.kill();
          reject(new Error('TLS fixture child timed out.'));
        }, 10000);
        child.once('close', (code) => {
          clearTimeout(timeout);
          if (code !== 0) {
            return reject(new Error('TLS fixture child could not finish.'));
          }
          try {
            resolve(JSON.parse(output.trim()));
          } catch {
            reject(new Error('TLS fixture child returned an invalid result.'));
          }
        });
      });
    const accepted = await handshake('db.example.test', true);
    assert.equal(accepted.authorized, true);
    assert.match(accepted.protocol, /^TLSv1\.[23]$/);
    assert.equal((await handshake('different.example.test', true)).error, 'ERR_TLS_CERT_ALTNAME_INVALID');
    assert.ok(
      ['UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'SELF_SIGNED_CERT_IN_CHAIN', 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY'].includes(
        (await handshake('db.example.test', false)).error,
      ),
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
