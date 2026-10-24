# Isolated Account sessions

Set `ACCOUNT_SESSION_COOKIE_NAME` on the server in Account and every host belonging to the **same environment**, then restart or redeploy those services. Its default is `pm_account_session`. An empty value also selects that default; any other value must start with a letter and contain at most 64 letters, digits, underscores or hyphens. Invalid configuration fails closed.

| Environment | Cookie name | Account cookie domain example |
| --- | --- | --- |
| Production | `pm_account_session` | `.patchman.io` |
| Staging | `pm_account_staging` | `.staging.patchman.io` |

Configure `ACCOUNT_COOKIE_DOMAIN` **only in Account**. Choose a staging Account URL such as `https://account.staging.patchman.io` and sibling app URLs such as `https://hookboy.staging.patchman.io`. This domain permits sharing that environment's login with its hosts. A production parent-domain cookie also reaches nested staging domains, so the **different cookie name is required**; a narrower staging domain by itself does not prevent ambiguity.

Every staging host must also point `NEXT_PUBLIC_ACCOUNT_URL` to the staging Account and use separate staging databases, service keys and provider credentials. Cookie naming complements those boundaries; it does not replace them. The Account application registry must trust only the exact origins assigned to that environment.

Account creates and clears only its configured cookie. Hosts read only their configured name, with no legacy-cookie fallback. A valid Bearer token takes precedence; an invalid explicit Authorization header cannot fall back to a cookie. The cookie name is server configuration, never a browser token or URL parameter. Signed-in browser sessions remain opaque, HttpOnly tokens. Landing currently has no backend session reader; its header uses the real Account SDK.

For local development, omit `ACCOUNT_COOKIE_DOMAIN` and keep every app on the same local hostname. A cookie-name change signs that environment's browser sessions out until they sign in again. Existing cookies under another name are ignored and are not cleared by this environment's sign-out.

Use `npm run lint` and the focused `__tests__/account-session-token.test.ts` checks after changing server authentication. Account's `__tests__/integration/session-cookie.ts` additionally exercises real signup/session/signout routes against a fresh local MySQL database, without touching a normal application database.

