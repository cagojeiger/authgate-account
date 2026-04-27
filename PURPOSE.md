# Purpose

authgate-account is a one-person account page for my own self-hosted authgate identity.

It is not an admin console.
It is not an operations dashboard.
It is not a user-management surface.

> 내가 운영하는 authgate가 내 계정에 대해 알고 있는 것을 내가 직접 확인하고, 필요하면 정리하는 곳.

## What it shows = authgate DB rows

This page is a viewer onto three authgate tables for the signed-in user, plus narrowly scoped cleanup actions on those rows. Nothing else.

| Section          | Source                  | What                                       |
|------------------|-------------------------|--------------------------------------------|
| Me               | `users` (1 row)         | name, email, status, sub, issuer           |
| Connected apps   | `refresh_tokens` (N rows) | per-client active tokens                  |
| Recent activity  | `audit_log` (N rows)    | account events (event_type, client, ip, time) |

Browser-stored artifacts (cookies, sessions, devices, localStorage) are implementation details. They never appear in the UI.

## Mental model

```
authgate
  └─ DB knows about user K
      ├─ users row
      ├─ refresh_tokens rows (one per (user, client) pair, isolated)
      └─ audit_log rows

authgate-account = a window onto those rows + per-row revoke
```

Tokens are per-client, not shared. SSO is the result of the authgate browser session, not of shared tokens. This page never exposes session-level concepts because they break per-client isolation.

## Positive Wireframe (locked)

```
Login (/)
┌────────────────────────────────────────────────────┐
│ authgate account                                   │
├────────────────────────────────────────────────────┤
│             [BLOB]                                 │
│        Manage connected services                   │
│   See which services can access your authgate ...  │
│                                                    │
│   ┌───────────────────────────────────────────┐    │
│   │ Continue with authgate                    │    │
│   │ Sign in via Google                        │    │
│   └───────────────────────────────────────────┘    │
└────────────────────────────────────────────────────┘

Account (/account)
┌────────────────────────────────────────────────────┐
│ authgate account       user@example.com [Sign out] │
├────────────────────────────────────────────────────┤
│ Overview │ [Services] │ Activity                   │  ← tabs (default Services)
├────────────────────────────────────────────────────┤
│ Connected Services                          3 apps │
│ ┌────────────────────────────────────────────────┐ │
│ │ name · scopes · last used         [Revoke]     │ │
│ └────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
```

Three tabs:
- **Overview** — read-only Email / Name / Status
- **Services** (default) — connected apps with per-row Revoke
- **Activity** — paginated audit log (page size 20, Prev/Next)

Single route `/account`; tabs are client-side state (no URL routing required for V1).

## Negative Wireframe (forbidden)

These surfaces MUST NOT be added.

```
┌──────────────────────────────┐
│ Sessions                     │  FORBIDDEN
│ - browser session list       │  authgate session ≠ client app logout.
│ - session revoke             │  Per-client isolation is broken.
└──────────────────────────────┘

┌──────────────────────────────┐
│ Sign out everywhere          │  FORBIDDEN
│ - revoke all refresh tokens  │  Nuclear option. Conflicts with the
│ - global session kill        │  per-app cleanup intent.
└──────────────────────────────┘

┌──────────────────────────────┐
│ Actions card                 │  FORBIDDEN
│ - delete account             │  Account deletion is a separate ADR
│ - security wizard            │  in the authgate repo, not here.
│ - request deletion           │  An "Actions" card invites scope creep.
└──────────────────────────────┘

┌──────────────────────────────┐
│ Admin / Users                │  FORBIDDEN
│ - user search                │  This is a one-person page.
│ - user edit / status change  │  Multi-user violates ADR-000.
│ - role / permission editing  │  RBAC violates ADR-000.
└──────────────────────────────┘

┌──────────────────────────────┐
│ Operations Dashboard         │  FORBIDDEN
│ - charts                     │  Account is not an ops surface.
│ - system health              │
│ - alerts / notifications     │
└──────────────────────────────┘

┌──────────────────────────────┐
│ Browser / device surfaces    │  FORBIDDEN
│ - "this device" / "browsers" │  Server-side DB only.
│ - cookie inspector           │  Browser stuff is implementation.
│ - token expiry countdown     │  Requires authgate API change.
└──────────────────────────────┘

┌──────────────────────────────┐
│ Profile / Identity edits     │  FORBIDDEN
│ - edit name / email          │  authgate is a token issuer, not a
│ - account linking            │  profile editor (ADR-000 non-goal).
│ - MFA / OTP setup            │  authgate has no MFA.
└──────────────────────────────┘
```

## Admission Rule (5 gates)

A new feature is allowed only if ALL answers are YES. If any answer is NO, reject without further discussion.

| Gate | Question                                                                                       | Required |
|------|------------------------------------------------------------------------------------------------|----------|
| 1    | Is this about the signed-in account itself?                                                    | YES      |
| 2    | Is the data already a row in authgate's DB (`users` / `refresh_tokens` / `audit_log`)?         | YES      |
| 3    | Does it fit exactly one of: Me / Connected apps / Recent activity?                             | YES      |
| 4    | Is the unit per-account or per-app (NOT per-session, per-device, per-browser)?                 | YES      |
| 5    | Does it stay clear of admin, multi-user, permissions, profile editing, ops monitoring, browser surfaces? | YES |

This rule replaces the older "4 question" validation. The "Actions" question that existed before was the entry point for forbidden surfaces and is removed.

## Only Allowed Mutations

The page exposes exactly two mutating actions.

```
Disconnect <app X>
  = UPDATE refresh_tokens
       SET revoked_at = now()
     WHERE user_id = me
       AND client_id = X
       AND revoked_at IS NULL

  Effect: app X cannot refresh access. Existing access tokens
          remain valid for up to ~15 minutes (cannot revoke JWTs).
```

```
Sign out
  = revoke this app's own refresh_token (same query as above with X = authgate-account)
  + destroy iron-session cookie

  Effect: this page is logged out. Other apps and the authgate
          browser session are not affected.
```

No other mutations are allowed in v1.

```
Forbidden mutations:
  ✗ Session revoke (breaks per-client isolation)
  ✗ Sign out everywhere (nuclear; conflicts with per-app intent)
  ✗ Account deletion (separate ADR in authgate repo required)
  ✗ Profile / identity edits (ADR-000 non-goal)
  ✗ Permission edits (ADR-000 non-goal)
```

## Responsive Layout (locked)

```
breakpoints (Tailwind defaults)
  mobile  < 640px              container 100%, padding 16px, header 52px
  tablet  640px - 1023px       container 720px, padding 20px, header 56px
  desktop >= 1024px            container 1100px, padding 24px, header 56px

  /account architecture
    all breakpoints            tab strip (Overview / Services / Activity)
                               + active tab content centered, mx-auto
    only width and padding change between breakpoints
```

The information architecture (3 tabs, two mutations: Sign out / Revoke connection) is identical across breakpoints. Tabs let users land directly on Services and let V2 add a tab without changing the rest of the layout.

Single-route SPA-style page. No additional pages such as `view all activity` or `device list`. Adding a new route is itself a scope-creep signal.

## Login UX (locked)

The sign-in CTA must surface the authgate → upstream IdP chain so the user is not surprised by the next screen.

```
┌─────────────────────────────────────────┐
│  Continue with authgate                 │  ← primary, brand fill
│  Sign in via Google                     │  ← subtitle
└─────────────────────────────────────────┘
```

Authgate is the issuer; Google (or future upstream IdP) is named explicitly. Both lines stay inside one button — they describe one action.

## What this also is — secondary identity

This is the first reference consumer of authgate. Its second purpose is to demonstrate, in working code, the contract authgate expects from a client.

It MUST demonstrate:

- Authorization Code + PKCE (browser channel)
- Server-side BFF: tokens live in iron-session HttpOnly cookies, never in JS-readable storage
- `id_token` verification with JWKS (RS256)
- `offline_access` scope to receive a refresh_token
- Client-side fetches go only to its own BFF (`/api/account/*`); the BFF talks to authgate
- Sign out revokes its own refresh_token at authgate before destroying the session

It MUST NOT demonstrate:

- localStorage / sessionStorage token storage
- `id_token` used as an API bearer
- Direct authgate DB reads
- Reliance on role / permission claims
- Session revoke or revoke-all UI
- Profile editing / account linking / MFA setup
- Multi-user admin API calls

The reference role is secondary. When the personal-tool role and the reference role conflict, the personal-tool role wins.

## Anchors

- authgate ADR-000: `.repos/authgate/docs/adr/000-authgate-identity.md` — identity boundary, non-goals
- authgate ADR-001: `.repos/authgate/docs/adr/001-adopt-zitadel-oidc.md` — protocol library
- authgate spec: `.repos/authgate/docs/spec/`
