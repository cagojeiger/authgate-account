import "server-only"
import type { IronSession } from "iron-session"
import * as client from "openid-client"
import { getOidcConfig } from "./openid"
import type { SessionData } from "./session"

// Try to refresh the access token using the refresh token. Mutates and saves
// the session on success. Caller must already be in a context where saving
// cookies is allowed (Route Handler / Server Action / middleware) — Server
// Components must NOT call this directly.
export async function tryRefresh(session: IronSession<SessionData>): Promise<boolean> {
  if (!session.refreshToken) return false

  try {
    const oidc = await getOidcConfig()
    const tokens = await client.refreshTokenGrant(oidc, session.refreshToken)
    session.accessToken = tokens.access_token
    if (tokens.refresh_token) session.refreshToken = tokens.refresh_token
    session.expiresAt = Math.floor(Date.now() / 1000) + (tokens.expires_in ?? 900)
    await session.save()
    return true
  } catch {
    return false
  }
}
