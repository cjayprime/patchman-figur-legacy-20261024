# Figur staging and production deployment

Configure the environment-specific Account session name before parallel staging/production use; see [session isolation](SESSION_COOKIES.md). All hosts in one environment must agree with its Account server.

Deployment audit: 23 October 2026. Local build evidence is `__tests__/.artifacts/final-build.log` (Next.js 16.4.1, successful compilation and route generation). This is not deployed acceptance.

## Hosting decision

Run the complete application on a bounded Node.js 22+ server/container for the current launch contract. Figur performs image inference/rendering in the browser and has no persistent server filesystem requirement, but its authenticated project API stores the photo inside the JSON document: the route accepts 24 MiB, project state up to 20 MiB and image data up to 16 MiB.

Normal Vercel Functions impose a 4.5 MB request/response limit. Raising Next's body parser limit does not raise the platform limit, so legitimate larger saves and subsequent reads will fail there. A smaller-photo demo is not proof that the full current workspace is deployable. Supporting that platform requires a separately designed authenticated asset transfer/storage path or a smaller product limit approved before release. [Vercel function limits](https://vercel.com/docs/functions/limitations).

## Environment and release sequence

The October 24 public check found that `figur.patchman.io` serves its static model/WASM assets while `/` and `/api/projects` return Vercel `404 NOT_FOUND`. This is a routing/build deployment failure, not a missing model file. The checked-in `vercel.json` explicitly selects the Next.js adapter, `npm run build`, and automatic output detection. Use the project root containing this app's `package.json` and `pages/` (the repository root for a separate Figur repository, or `Figur` for the full ecosystem repository). Do not select `public` or a static export as the deployment output. Redeploy the updated source, then verify real page/API responses before performing authenticated UAT. This configuration does not remove the payload/connection limits discussed above.

1. Use separate explicitly named staging and production databases and credentials. Configure `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD` and `DATABASE_NAME` for each deployment; retain prior databases and backups.
2. Set `NEXT_PUBLIC_ACCOUNT_URL` before building to that environment's real HTTPS Account origin. Register the exact Figur HTTPS origin in Account's allowlist; configure Account's sibling-domain cookie policy. Keep staging sessions, financial accounts and databases separate from production.
3. Use `npm ci`, `npm run lint`, `npm run typecheck -- --incremental false` and `npm run build`. Do not copy a localhost validation build to production. Leave `PATCHMAN_BUILD_DIR` unset for the normal `.next` release artifact.
4. Run one web process through `npm run start`; its npm script supplies `-p 3602`. Route HTTPS traffic to that internal port. Keep proxy request limits at least as large as the application limit and configure MySQL packet limits for the bounded JSON documents. Do not put a 4.5 MB Function proxy in front of the same unchanged API.
5. Startup runs the creation migration and schema check before readiness, followed by seeders. A managed Next deployment that only runs the build command does not execute these prestart hooks; its schema needs a separately controlled release step. Vercel's build behavior is documented in [build configuration](https://vercel.com/docs/builds/configure-a-build).

`DATABASE_MAX_CONNECTIONS=6` and `DATABASE_WORKER_COUNT=0` bound a single process. A singleton pool is not a distributed connection cap. Count both environments, every replica and maintenance process against the cluster's 75 connections. Eleven production apps at six already use 66; duplicating that topology for staging does not fit. Serverless scaling requires an actual database proxy/concurrency budget, rather than merely reusing the same environment value. [Vercel connection pooling](https://vercel.com/kb/guide/connection-pooling-with-functions).

Runtime and migration clients support verified database TLS through `DATABASE_TLS_MODE=verify-full`, optional inline `DATABASE_TLS_CA` or a `DATABASE_TLS_CA_FILE`. Use the provider's certificate DNS hostname. Certificate trust and hostname checks cannot be disabled; invalid CA material fails before connecting. See [DATABASE_TLS.md](DATABASE_TLS.md) for setup and verification.

## Required deployed checks

Verify the three tracked model files under `/models/` and six runtime files under `/wasm/` return actual assets, not an HTML fallback. Automatic body detection requires those self-hosted assets and suitable browser WebGL/WASM support; manual shaping must remain usable on detection failure. No third-party model CDN is required by the current detector.

Use real Account sign-in at the deployed origin. Create a project, select a representative large photo, change shaping and view controls, reload the direct numeric project route and download a PNG. Test a second account cannot open the first account's project, sign-out errors, all three central modals, and mobile layouts. Include a save/read above 4.5 MB to exercise the hosting boundary. Verify database backup restoration using an isolated restored database; saved photos live in MySQL.

Do not mark live UAT, DNS/TLS, managed database connectivity, deployed model delivery or backup restoration passed until those checks run against the actual environment URLs.
