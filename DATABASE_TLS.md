# Automatic MySQL transport

This application reads only five database environment settings: `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD` and `DATABASE_NAME`. The hostname determines its transport; there are no application TLS switches or application certificate settings.

Set `DATABASE_HOST` to the provider's certificate DNS hostname, without a URL or port, and supply the port separately. A missing, blank or malformed host is rejected before connection. Remote numeric IP addresses are rejected because the current MySQL adapter does not consistently verify IP certificate identity; use the provider's DNS endpoint instead.

Explicit `localhost`, IPv4 loopback addresses in `127.0.0.0/8`, IPv6 `::1` and IPv4-mapped loopback addresses use local plaintext transport. Every other accepted DNS hostname automatically requires TLS 1.2 or newer, a trusted certificate chain and matching certificate hostname. This policy is identical in development, tests, staging and production. There is no insecure retry or plaintext fallback for remote endpoints. Disabling Node's certificate verification globally is refused for remote database connections.

## Certificate trust

The MySQL driver uses Node's normal trusted certificates. No custom application CA file is mandatory. If the provider uses a private CA outside Node's normal trust, provision that CA through the deployment runtime's certificate-trust mechanism. Node's standard `NODE_EXTRA_CA_CERTS` can extend trust at process launch; it is a Node runtime option, not a replacement Patchman database setting. Mount any required trust file outside source control and provide it to every affected runtime, CLI and worker process. Do not disable chain or hostname verification to bypass a trust failure. Restart affected Node processes after changing their trust configuration. [Node 22 certificate trust documentation](https://nodejs.org/download/release/v22.23.0/docs/api/cli.html#node_extra_ca_certsfile).

The runtime Sequelize client and migration/seeder configuration both call this repository's standalone transport helper. They do not import another application's configuration. Normal startup still applies migrations before readiness; a certificate failure stops the connection rather than trying an unverified alternative.

## Verification

The focused tests make no application database requests. They generate disposable test certificates and run actual loopback TLS handshakes in child Node processes. A matching certificate is accepted only when the child trusts its isolated test CA through Node's standard trust option; mismatched hostnames and untrusted chains are rejected. Tests also cover explicit loopback plaintext, automatic remote TLS, malformed hosts, remote numeric-address rejection, global-verification bypass rejection and runtime/CLI wiring. Temporary sockets, processes and certificate files are closed or removed afterward.

Run `node --import ./__tests__/register.mjs --test __tests__/database-tls.test.ts` from this application.

The optional `node --import ./__tests__/register.mjs __tests__/integration/database-tls.mjs` compatibility check refuses nonlocal hosts, opens one maintenance connection at a time and issues only `SELECT 1`. It does not create or reset tables.

These checks verify local transport behavior, not the production provider's chain, firewall access or credentials. Validate the actual managed endpoint, authenticated requests and reconnection before recording production acceptance. Do not assume that deleting certificate settings proves a successful remote connection.
