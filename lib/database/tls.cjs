'use strict';
const { isIP } = require('node:net');

function failure(message) {
  throw new Error(`Database TLS configuration: ${message}`);
}

function loopbackAddress(host, version) {
  if (version === 4) {
    return host.startsWith('127.');
  }
  if (version !== 6) {
    return false;
  }
  const canonical = new URL(`http://[${host}]`).hostname;
  return canonical === '[::1]' || /^\[::ffff:7f[0-9a-f]{2}:[0-9a-f]{1,4}\]$/.test(canonical);
}

function databaseTls(env = process.env) {
  const host = env.DATABASE_HOST;
  if (typeof host !== 'string' || !host || host.length > 253 || host !== host.trim()) {
    failure('Provide an explicit database hostname or local loopback address.');
  }
  const version = isIP(host);
  if (version) {
    if (loopbackAddress(host, version)) {
      return {};
    }
    failure('Use the provider certificate DNS hostname for a remote database, not a numeric address.');
  }
  const dns = host.endsWith('.') ? host.slice(0, -1) : host;
  if (!dns.split('.').every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label))) {
    failure('Provide a valid database DNS hostname without a URL, port or private path.');
  }
  if (dns.toLowerCase() === 'localhost') {
    return {};
  }
  if (env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
    failure('Certificate and hostname verification cannot be disabled for a remote database.');
  }
  return { ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true, verifyIdentity: true } };
}

module.exports = { databaseTls };
