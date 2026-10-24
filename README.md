# Figur

Runtime requirement: **Node.js 22 or newer**. Use Node 22 for the shared compatibility baseline (`.nvmrc` / `.node-version`), then run `npm install` inside this repository. npm rejects unsupported engines; install, development, production startup and builds also check the runtime explicitly.

Figur is Patchman's browser-based image workspace for WebGL and MediaPipe editing.
Account supplies real authentication, entitlements and the shared Ads, Help and
profile interfaces. The only Account address is `NEXT_PUBLIC_ACCOUNT_URL`.

The fresh backend uses `patchman_figur_v3`. Earlier databases are retained.
Its two application tables use named unsigned BIGINT primary keys and numeric
ownership/relationship fields. APIs serialize these identifiers as decimal
strings; they never pass through JavaScript numbers. Server-generated audit
timestamps and resource references survive project deletion without retaining
image bytes in audit details.

## Development

Copy `.env.example` to `.env`, configure MySQL and Account, then run:

```bash
npm install
npm run database:create
npm run dev
```

Startup applies the one creation migration and checks the schema before Next
starts. It runs seeders asynchronously after readiness; no sample identities or
production seed data are installed. Incompatible tables stop startup. Normal
startup does not reset or convert old records.

The npm scripts select port 3602 with `-p`; environment variables do not select
the listening port. `DATABASE_MAX_CONNECTIONS` is an app-wide budget (default 7,
launch value 6); `DATABASE_WORKER_COUNT=0` reserves the full web allocation.
Maintenance commands use one connection and always close their pool.

## Project interfaces

- `GET /api/projects?before=<project_id>` lists up to 100 owned summaries and a
  `nextCursor`, without loading every saved image state.
- `POST /api/projects` creates a project and its audit event transactionally.
- `GET /api/projects/:id` fetches an owned project.
- `PATCH /api/projects/:id` requires `expectedRevision`, accepts a name, an
  editing section and/or a version-1 JSON state, and prevents lost updates.
- `DELETE /api/projects/:id` deletes the owned project and retains its audit.
- `GET /api/activity?projectId=<project_id>&before=<activity_event_id>` reads
  owner-scoped history, including events for deleted projects.

All routes verify Account ownership and app access. Customer-supplied owners
are ignored. Invalid identifiers, unsupported state versions and invalid tools
are rejected. Saved JSON is capped at 20 MiB. Database constraints also reject
zero-valued required relationships when MySQL is running without strict mode.

## Verification and remaining work

Run `npm test`, `npm run test:projects`, `npm run typecheck`, `npm run lint` and
`npm run build`. The project integration suite creates and removes only its own
guarded local database. Account's `npm run test:figur` uses real registration and
isolated servers for HTTP/browser ownership and shared-modal checks.

The WebGL editor initializes and disposes explicitly for each project route.
Source photos, manual shaping points, body controls, debug settings, comparison,
camera position and selected section autosave through the owned revision API.
Conflicting edits remain visible locally instead of silently replacing another
window's changes. Keep the window open and use Retry Save after a network error.
Photo editing stays in the browser; saving a project stores its private image
and controls in the authenticated Figur backend. Images never go to remote AI.
Uploads accept JPG, PNG and WebP up to 24 MB, normalized to WebP and bounded to
4,194,304 pixels with a 4,096-pixel maximum edge. This is not lossless archival
storage. Saved portrait documents validate every field and cap image data at
16 MiB. Automatic body detection requires the self-hosted MediaPipe assets;
manual control points, comparison and PNG export remain usable if detection
fails.

`npm run test:workspace` uses global Playwright and installed Chrome against
isolated production builds (`.next-workspace-check`), real Account registration
and guarded MySQL fixtures. Build Account and Figur with
`NEXT_PUBLIC_ACCOUNT_URL=http://127.0.0.1:3612` and that build directory first.
The fixture owns ports 3612 and 3620 and removes only its own databases and
processes. It verifies 101-project pagination, identifiers above 2^53, actual
photo/control-point/slider/comparison restoration after refresh and same-route
navigation, no duplicate interaction listeners, PNG download, cross-owner
denial, all three shared modals and 1440/900/390/320-pixel layouts.
Native tests, real MySQL project checks, non-incremental type checking and the
isolated production build also pass. Full deployment and production acceptance
remain separate from these local results.

## Public support codes

- `680001`: required Figur or Account configuration is missing.
- `680002`: Figur could not complete an internal or dependent-service action.
- `680003`: an action could not be completed and may require support.
- `680004`: Figur or a dependency is busy or has reached its allowance.

Production responses provide a descriptive reviewed message and support code;
private configuration, provider payloads, stack traces and database details stay
out of responses. Development may append a clearly marked `DEV-ONLY` diagnostic.

Database provisioning connects without selecting MySQL's system database and uses one maintenance connection. Set an explicit application `DATABASE_NAME`; `npm run database:create` only creates that validated schema if missing and never resets it. Grant the runtime login access only to its own application schema; do not grant access to `mysql.*` to run this helper.

Disposable database/browser suites use the existing local DATABASE_HOST, DATABASE_PORT, DATABASE_USER and DATABASE_PASSWORD settings. No additional MySQL login or test credential variables are required. Tests guard their generated temporary schema names before creation or cleanup, and each maintenance pool uses one connection. Tests never create users or change privileges. A login restricted to its application database can run the application normally but cannot create unrelated temporary schemas; those integration checks report the permission failure rather than modifying the real database or broadening access.

Run configuration and namespace checks with `node --test __tests__/database-provisioning.test.mjs __tests__/database-maintenance.test.mjs`. These checks do not create users, databases or records. Actual database suites additionally require the configured existing login to have permission for their disposable schemas.