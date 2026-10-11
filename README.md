# Figur

Figur is Patchman's browser-based image workspace for local WebGL and MediaPipe
editing. The Next.js application provides projects, Account identity and
entitlement checks, activity history, shared Help, and the development-only
FakeSignin flow. Model assets and image processing remain local where browser APIs
and privacy require them.

## Development

Copy `.env.example` to `.env`, configure MySQL and the Account service, then run:

```bash
npm install
npm run dev
```

Startup applies the creation migration before Next starts and runs seeders in the
background after the server becomes available.

## Public support codes

- `680001`: required Figur or Account configuration is missing.
- `680002`: Figur could not complete an internal or dependent-service action.
- `680003`: an action could not be completed and may require support.
- `680004`: Figur or a dependency is busy or has reached its allowance.

Production responses expose the support code rather than private configuration,
provider payloads, stack traces, or database details. Development may append a
clearly marked `DEV-ONLY` diagnostic.
