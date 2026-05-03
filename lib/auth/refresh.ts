import "server-only"
import type { IronSession } from "iron-session"
import * as client from "openid-client"
import { getOidcConfig } from "./openid"
import type { SessionData } from "./session"

type TokenResponse = Awaited<ReturnType<typeof client.refreshTokenGrant>>

// Single-process singleflight: if two concurrent requests refresh the same
// refresh_token, only the first hits authgate; the second awaits the same
// Promise. authgate rotates refresh tokens on use, so without this a race
// would invalidate the token for whichever request loses.
const inFlight = new Map<string, Promise<TokenResponse>>()

export async function tryRefresh(session: IronSession<SessionData>): Promise<boolean> {
  if (!session.refreshToken) return false
  const key = session.refreshToken

  let promise = inFlight.get(key)
  if (!promise) {
    promise = (async () => {
      const oidc = await getOidcConfig()
      return client.refreshTokenGrant(oidc, key)
    })()
    inFlight.set(key, promise)
    promise.finally(() => {
      if (inFlight.get(key) === promise) inFlight.delete(key)
    })
  }

  try {
    const tokens = await promise
    session.accessToken = tokens.access_token
    if (tokens.refresh_token) session.refreshToken = tokens.refresh_token
    session.expiresAt = Math.floor(Date.now() / 1000) + (tokens.expires_in ?? 900)
    await session.save()
    return true
  } catch (err) {
    const e = err as { code?: string; error?: string; status?: number; message?: string }
    console.error("[tryRefresh] failed", {
      code: e.code,
      error: e.error,
      status: e.status,
      message: e.message,
    })
    return false
  }
}
