# Verified MySQL TLS

Account, Figur, Flux and HookBoy use the same standalone connection contract in their runtime Sequelize client and migration/seeder CLI configuration. No application imports another repository's private configuration.

For a managed database, configure:

```dotenv
DATABASE_HOST=the-database-certificate-hostname
DATABASE_TLS_MODE=verify-full
DATABASE_TLS_CA=
DATABASE_TLS_CA_FILE=
```

Explicitly set DATABASE_HOST to the exact DNS hostname supplied by the database provider, not its numeric IP, a URL or a host with an appended port. An omitted or empty hostname is rejected in verified mode. Continue using DATABASE_PORT separately. The MySQL driver suppresses DNS identity verification for raw IP hosts; this configuration rejects that ambiguous setup rather than silently weakening verification.

When the provider uses a CA trusted by Node, leave both CA values empty. For a private/provider CA, use one of:

- DATABASE_TLS_CA: the complete PEM CA bundle. Actual line breaks and literal backslash-n separators are accepted.
- DATABASE_TLS_CA_FILE: an explicitly selected, readable file provisioned by the operator. Prefer an absolute path mounted outside the application source and build output. Provide it separately wherever build, migration, worker and runtime processes need it; deployment packaging does not provision this file. Keep private deployment files outside source control.

Do not set both CA sources. The helper bounds the bundle to 256 KiB and 32 certificates and validates every certificate as a currently valid certificate authority. Malformed, expired, non-CA or extra private-key/text material fails before a connection is made. Errors never include the CA contents or configured file path.

Verified mode sets rejectUnauthorized and mysql2 verifyIdentity to true and requires TLS 1.2 or newer. There is no encrypted-but-unverified mode, downgrade fallback or environment option to bypass certificate/hostname verification. NODE_TLS_REJECT_UNAUTHORIZED=0 and attempted database identity-verification overrides are refused.

DATABASE_TLS_MODE=disabled is the explicit local/trusted-network compatibility mode and the default for existing local configurations. It supplies no SSL options. Do not use it for an externally hosted database that requires TLS. Supplying CA material while leaving TLS disabled fails instead of silently ignoring the CA. Changing mode, hostname or certificates requires restarting the app and any maintenance processes; existing pools do not change during hot reload.

Set the same values for controlled migrations and the application runtime. npm startup applies migrations before readiness, so a trust failure must stop deployment rather than continue with another connection mode. No schema reset, credential change or cloud object operation is needed to enable TLS.

The per-process DATABASE_MAX_CONNECTIONS budget still applies with TLS. Count staging, production, replicas, database workers and temporary maintenance separately against the shared cluster limit. TLS does not turn separate process pools into a global pool.

## Verification

The runtime CA filename uses Next's supported `turbopackIgnore` annotation at the two filesystem calls. This prevents an unknown deployment path from widening the server dependency trace to the whole project; it does not change Node's file access, CA validation or TLS verification. Use an operator-mounted CA file or inline `DATABASE_TLS_CA`; do not rely on the bundler to copy a deployment certificate. Public runtime assets keep their normal delivery paths. [Next's filesystem annotation](https://github.com/vercel/next.js/pull/95144), [output file tracing](https://nextjs.org/docs/app/api-reference/config/next-config-js/output).

The native tests include six TLS checks: real isolated loopback TLS handshakes accept a configured CA with its matching DNS name, reject a mismatched name and untrusted CA, and validate mode restrictions, CA bundles/files, private-material redaction and runtime/CLI wiring. Temporary test certificates are generated with OpenSSL and removed; no production certificate or private key is used.

Run the focused suite with:

```text
node --import ./__tests__/register.mjs --test __tests__/database-tls.test.ts
```

The read-only local MySQL compatibility check uses one CLI connection followed by one runtime connection and issues only SELECT 1. It refuses nonlocal database hosts:

```text
node --import ./__tests__/register.mjs __tests__/integration/database-tls.mjs
```

A live managed-MySQL TLS handshake still requires the deployment's actual hostname, CA and credentials. Validate migrations, authenticated requests and reconnection against that environment before marking production acceptance passed. Do not weaken verification after a trust failure: obtain the correct endpoint/CA and check certificate validity and server time.
