# authgate-account

A one-person account page for a self-hosted [authgate](https://github.com/cagojeiger/authgate) identity. Lets the signed-in user view what authgate's DB knows about them and revoke per-app refresh tokens.

This is **not** an admin console, ops dashboard, or user-management surface. See [`docs/PURPOSE.md`](docs/PURPOSE.md) for the scope guardrails (negative wireframe + 5-gate admission rule). Architecture and BFF flow are in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Stack

- Next.js 16 (App Router, Turbopack, `output: standalone`)
- React 19, Tailwind v4
- `iron-session` 8 (HttpOnly cookie BFF), `jose` 6 (JWKS verify)
- Node 24 runtime, Docker / GHCR release

## Run locally

```bash
npm ci
# create .env.local with the values below
npm run dev   # http://localhost:3000
```

### Required env vars

| Var | Example | Notes |
|---|---|---|
| `AUTHGATE_ISSUER` | `https://authgate.project-jelly.io` | OIDC issuer base URL |
| `AUTHGATE_CLIENT_ID` | `authgate-account` | OIDC client registered at authgate |
| `AUTHGATE_REDIRECT_URI` | `http://localhost:3000/api/auth/callback` | Must match the client registration |
| `SESSION_SECRET` | 32+ char random string | iron-session encryption key |
| `APP_URL` | `http://localhost:3000` | Used for all server-issued redirects |

`AUTHGATE_*` and `SESSION_SECRET` are read lazily, so `npm run build` works without them set; they are only required at request time.

## Run in Docker

```bash
docker build -t authgate-account .
docker run --rm -p 3000:3000 --env-file .env.local authgate-account
```

Production images are published to GHCR by `.github/workflows/` on tagged releases.

## Layout

```
app/
  page.tsx                login (Sign in with Google)
  account/page.tsx        SSR shell + tabs (Overview / Services / Activity)
  api/auth/*              login → callback → logout (PKCE + iron-session)
  api/account/*           BFF for connections + audit-log
lib/
  auth/                   session, oidc (jose+JWKS), pkce, authgate (401→refresh→retry)
  api/authgate-client.ts  thin wrapper over authgate /console/me/* endpoints
  env.ts                  lazy required() env config
proxy.ts                  Next 16 middleware: /account/:path* auth gate
docs/                     PURPOSE.md, ARCHITECTURE.md
```

## License

See [`LICENSE`](LICENSE).
