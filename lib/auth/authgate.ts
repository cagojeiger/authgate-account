import "server-only"
import type { IronSession } from "iron-session"
import { config } from "@/lib/env"
import type { SessionData } from "./session"

// Token refresh is handled by proxy.ts; this only attaches the bearer token.
// Server Components can call this safely because it never writes cookies.
export async function authgateFetch(
  path: string,
  session: IronSession<SessionData>,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(`${config.authgate.issuer}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${session.accessToken}`,
    },
    cache: "no-store",
  })
}
