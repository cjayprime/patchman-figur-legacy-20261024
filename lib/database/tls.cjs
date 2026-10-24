'use strict';
const { X509Certificate } = require('node:crypto');
const { readFileSync, statSync } = require('node:fs');
const { isIP } = require('node:net');
const { createSecureContext } = require('node:tls');

const MAX_CA_BYTES = 256 * 1024;
function failure(message) {
  throw new Error('Database TLS configuration: ' + message);
}
function certificateBundle(value) {
  const source = value.replace(/\\n/g, '\n').trim();
  if (Buffer.byteLength(source, 'utf8') > MAX_CA_BYTES) failure('The CA bundle is too large.');
  const certificates = source.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g);
  if (!certificates || certificates.length > 32 || source.replace(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g, '').trim()) {
    failure('Provide a PEM certificate-authority bundle without private keys or extra text.');
  }
  for (const pem of certificates) {
    try {
      const certificate = new X509Certificate(pem);
      if (!certificate.ca || Date.parse(certificate.validFrom) > Date.now() || Date.parse(certificate.validTo) <= Date.now()) {
        failure('The CA bundle must contain currently valid certificate-authority certificates.');
      }
    } catch {
      failure('The CA bundle must contain currently valid certificate-authority certificates.');
    }
  }
  try {
    createSecureContext({ ca: certificates, minVersion: 'TLSv1.2' });
  } catch {
    failure('The CA bundle could not be loaded.');
  }
  return certificates;
}
function databaseTls(env = process.env) {
  const mode = env.DATABASE_TLS_MODE || 'disabled';
  const inline = env.DATABASE_TLS_CA || '';
  const filename = env.DATABASE_TLS_CA_FILE || '';
  if (!['disabled', 'verify-full'].includes(mode)) failure('Choose disabled or verify-full mode.');
  if (mode === 'disabled') {
    if (inline || filename) failure('Enable verify-full mode before supplying a CA bundle.');
    return {};
  }
  if (env.NODE_TLS_REJECT_UNAUTHORIZED === '0' || env.DATABASE_TLS_REJECT_UNAUTHORIZED !== undefined || env.DATABASE_TLS_VERIFY_IDENTITY !== undefined) {
    failure('Certificate and hostname verification cannot be disabled or overridden.');
  }
  const host = env.DATABASE_HOST;
  if (typeof host !== 'string' || !host || isIP(host) || host.length > 253 || !/^[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?$/.test(host) || host.includes('..')) {
    failure('Use the database certificate DNS hostname for verify-full mode.');
  }
  if (inline && filename) failure('Choose either the inline CA bundle or its server file, not both.');
  let ca;
  if (filename) {
    let source;
    try {
      const info = statSync(/* turbopackIgnore: true */ filename);
      if (!info.isFile() || info.size > MAX_CA_BYTES) failure('The CA file is missing, unreadable or too large.');
      source = readFileSync(/* turbopackIgnore: true */ filename, 'utf8');
    } catch {
      failure('The CA file is missing, unreadable or too large.');
    }
    ca = certificateBundle(source);
  } else if (inline) {
    ca = certificateBundle(inline);
  }
  return { ssl: { ...(ca ? { ca } : {}), minVersion: 'TLSv1.2', rejectUnauthorized: true, verifyIdentity: true } };
}
module.exports = { databaseTls };
