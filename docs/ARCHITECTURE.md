# Architecture

This document describes how authgate-account is wired. Scope and forbidden surfaces are in [`PURPOSE.md`](PURPOSE.md); this file covers the runtime shape only.

## TL;DR

A Next.js App Router app that acts as a **BFF** in front of authgate.

- Tokens never leave the server. The browser only ever sees an iron-session HttpOnly cookie (`aa_session`).
- The only browser-visible API surface is `/api/auth/*` and `/api/account/*` on this app's own origin. The browser never calls authgate directly.
- Auth is OIDC Authorization Code + PKCE. `id_token` is verified against authgate's JWKS (`/keys`).
- `/account` is server-rendered with the initial data; tabs re-fetch through the BFF on mount and after mutations.

## Components

```
browser ──► /api/auth/login        (302 → authgate/authorize)
            /api/auth/callback     (code → exchange → JWKS verify → save iron-session)
            /api/auth/logout       (revoke RT at authgate, destroy session)

browser ──► /account               (SSR: getSession + getAccountData in parallel)
browser ──► /api/account/*         (CSR: BFF → authgateFetch → authgate /console/me/*)

middleware: proxy.ts               (matcher /account/:path* — redirect to / if !session.sub)
```

Server-only files: `lib/auth/*`, `lib/api/authgate-client.ts`, all `app/api/**`, all `_queries/**`.
Client-only files: anything with `"use client"` under `app/account/_components/*`.

## Cookies

| Cookie | Lifetime | Set by | Purpose |
|---|---|---|---|
| `aa_session` | iron-session default | `app/api/auth/callback/route.ts:57` | encrypted session: `sub`, `email`, `name`, `accessToken`, `refreshToken` |
| `pkce_verifier` | 5 min | `app/api/auth/login/route.ts:12` | per-attempt PKCE secret, deleted on callback |
| `pkce_state` | 5 min | `app/api/auth/login/route.ts:19` | CSRF-style state, compared on callback |

All HttpOnly, `sameSite=lax`, `secure` in production.

## Login → callback flow

```
GET /api/auth/login                                 [app/api/auth/login/route.ts]
  ├─ pkce.ts: verifier (32B), challenge (S256), state (16B)
  ├─ set pkce_verifier + pkce_state cookies (5 min)
  └─ 302 → ${ISSUER}/authorize?
            client_id, response_type=code, redirect_uri,
            scope="openid profile email offline_access",
            code_challenge, code_challenge_method=S256, state

GET /api/auth/callback?code&state                   [app/api/auth/callback/route.ts]
  ├─ if ?error          → / ?error=…
  ├─ if !code | !state  → / ?error=missing_params
  ├─ state ≠ stored     → / ?error=state_mismatch
  ├─ delete pkce cookies
  ├─ exchangeCode(code, verifier)                   [lib/auth/oidc.ts:16]
  │     POST ${ISSUER}/oauth/token  grant_type=authorization_code
  ├─ verifyIdToken(id_token)                        [lib/auth/oidc.ts:37]
  │     jose.jwtVerify against ${ISSUER}/keys, audience = client_id
  ├─ fetchUserinfo(access_token)                    [lib/auth/oidc.ts:49]
  │     authgate sets IDTokenUserinfoClaimsAssertion=false, so email/name
  │     are not in id_token — fetch from /userinfo instead.
  ├─ save iron-session { sub, email, name, accessToken, refreshToken }
  └─ 302 → /account                                 (via config.appUrl, not req.url)
```

## /account render flow

```
GET /account                                        [app/account/page.tsx]
  ├─ getSession()                                   [lib/auth/session.ts]
  ├─ if !session.sub → redirect("/")
  ├─ getAccountData(session)                        [app/account/_queries/get-account-data.ts]
  │     parallel: GET /console/me/connections, GET /console/me/audit-log?page=1&limit=20
  │     401 on either → redirect("/")
  └─ <AccountTabs initial={...} />                  client component, default tab = "services"

(client) tab fetches on mount + after mutation     [_components/connected-apps.tsx, recent-activity.tsx]
  GET /api/account/connections                     [app/api/account/connections/route.ts]
  GET /api/account/audit-log                       [app/api/account/audit-log/route.ts]
    ├─ requireUser() → 401 if no session            [lib/auth/require-user.ts]
    └─ authgateClient.* → authgateFetch(...)
```

## Token refresh

```
authgateFetch(path, session, init)                  [lib/auth/authgate.ts]
  ├─ fetch ${ISSUER}${path}, Bearer = session.accessToken
  ├─ if not 401 → return
  ├─ refreshAccessToken(session)
  │     POST /oauth/token grant_type=refresh_token, client_id, refresh_token
  │     on ok → session.accessToken = new; save()
  ├─ ok → retry once with new access token
  └─ refresh failed → session.destroy() and return the original 401
```

The page-level handler (`get-account-data.ts`) and the API routes both treat 401 as "redirect to /", so a destroyed session always lands on the login page on the next request.

## Logout

```
POST /api/auth/logout                               [app/api/auth/logout/route.ts]
  ├─ if session.refreshToken → POST ${ISSUER}/oauth/revoke (best-effort, .catch swallows)
  ├─ session.destroy()
  └─ 302 → /
```

Best-effort revoke means a network failure to authgate won't strand the user in a "can't sign out" loop.

## Middleware

`proxy.ts` (named `proxy.ts` per Next 16 convention, not `middleware.ts`):

```
matcher: /account/:path*
  read aa_session
  if !session.sub → 302 to ${APP_URL}/
  else next()
```

Edge runtime can't use `next/headers` `cookies()`, so `proxy.ts` builds its own `getIronSession(req, res, options)`. Session option fields (cookie name, password, options) duplicate `lib/auth/session.ts` — keep them in sync.

## Env config (`lib/env.ts`)

`config.authgate` and `config.session` are **lazy getters** that throw `Missing env var: X` on first access. This is what makes `next build` work without env present (build-time imports don't trigger the getter). Anything that runs at request time will throw immediately if a required env is missing, which is the intended fail-fast.

`config.appUrl` is eager with a `http://localhost:3000` fallback — used by every server-issued redirect.

## Reference-consumer mapping

PURPOSE.md says authgate-account's secondary purpose is to demonstrate the contract authgate expects from a client. Each MUST item maps to a concrete file:

| MUST demonstrate | Where |
|---|---|
| Authorization Code + PKCE | `lib/auth/pkce.ts`, `app/api/auth/login/route.ts` |
| Server-side BFF, tokens in HttpOnly cookies | `lib/auth/session.ts`, `proxy.ts` |
| `id_token` JWKS verification (RS256) | `lib/auth/oidc.ts:37` (`createRemoteJWKSet` + `jwtVerify`) |
| `offline_access` scope for refresh_token | `app/api/auth/login/route.ts:31` |
| Client fetches go only to its own BFF | `app/account/_components/*` use `/api/account/*`; never `${ISSUER}/...` |
| Sign out revokes its own refresh_token | `app/api/auth/logout/route.ts:9` |

The MUST NOTs (no localStorage tokens, no `id_token` as bearer, no direct DB reads, no role/permission claims, no session-revoke or revoke-all UI, no profile editing, no admin APIs) are enforced by **absence** — there is no code that does any of these. PURPOSE.md's negative wireframe is the canonical list.

## What's intentionally missing in v1

- **Status field** is hardcoded to `active` in `_components/overview.tsx`. PURPOSE lists `status` as a `users` row field, but the authgate `/console/me` endpoints don't surface it yet.
- **Revoke error UX** is silent on non-401 failures (see `_components/connected-apps.tsx:51`). 1-person tool — acceptable for v1.
- **Tabs are client-side state**, not URL-routed. Adding `?tab=` would be a v2 change; PURPOSE flags new routes themselves as a scope-creep signal.
