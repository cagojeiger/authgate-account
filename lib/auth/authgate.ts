import type { IronSession } from "iron-session"
import { config } from "@/lib/env"
import type { SessionData } from "./session"

async function refreshAccessToken(session: IronSession<SessionData>): Promise<boolean> {
  if (!session.refreshToken) return false

  const res = await fetch(`${config.authgate.issuer}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: config.authgate.clientId,
      refresh_token: session.refreshToken,
    }),
  })
  if (!res.ok) return false

  const tokens = (await res.json()) as { access_token: string; refresh_token?: string }
  session.accessToken = tokens.access_token
  if (tokens.refresh_token) session.refreshToken = tokens.refresh_token
  await session.save()
  return true
}

export async function authgateFetch(
  path: string,
  session: IronSession<SessionData>,
  init: RequestInit = {},
): Promise<Response> {
  const url = `${config.authgate.issuer}${path}`
  const headers = (token: string): HeadersInit => ({
    ...init.headers,
    Authorization: `Bearer ${token}`,
  })

  const res = await fetch(url, { ...init, headers: headers(session.accessToken), cache: "no-store" })
  if (res.status !== 401) return res

  if (await refreshAccessToken(session)) {
    return fetch(url, { ...init, headers: headers(session.accessToken), cache: "no-store" })
  }

  await session.destroy()
  return res
}
