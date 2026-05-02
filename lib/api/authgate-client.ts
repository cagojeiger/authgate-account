import type { IronSession } from "iron-session"
import { authgateFetch } from "@/lib/auth/authgate"
import type { SessionData } from "@/lib/auth/session"

type AuthgateSession = IronSession<SessionData>

export async function getConnections(session: AuthgateSession): Promise<Response> {
  return authgateFetch("/console/me/connections", session)
}

export async function revokeConnection(
  session: AuthgateSession,
  clientId: string,
): Promise<Response> {
  return authgateFetch(`/console/me/connections/${clientId}`, session, {
    method: "DELETE",
  })
}

export async function getAuditLog(session: AuthgateSession): Promise<Response> {
  return authgateFetch("/console/me/audit-log?page=1&limit=20", session)
}

export const authgateClient = {
  getConnections,
  revokeConnection,
  getAuditLog,
}
