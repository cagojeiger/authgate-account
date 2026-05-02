import type { IronSession } from "iron-session"
import { redirect } from "next/navigation"
import { authgateClient } from "@/lib/api/authgate-client"
import type { SessionData } from "@/lib/auth/session"

type Session = IronSession<SessionData>

export interface Connection {
  client_id: string
  name: string
  url?: string | null
  scopes: string[]
  last_used: string
}

export interface AuditEvent {
  id: number
  event_type: string
  ip_address: string
  user_agent: string
  metadata: Record<string, unknown>
  created_at: string
}

export interface AccountInitialData {
  connections: Connection[] | null
  events: AuditEvent[] | null
}

export async function getAccountData(session: Session): Promise<AccountInitialData> {
  const [connectionsRes, eventsRes] = await Promise.all([
    authgateClient.getConnections(session),
    authgateClient.getAuditLog(session),
  ])

  if (connectionsRes.status === 401 || eventsRes.status === 401) {
    redirect("/")
  }

  let connections: Connection[] | null = null
  let events: AuditEvent[] | null = null

  if (connectionsRes.ok) {
    const data = await connectionsRes.json() as { connections?: Connection[] }
    connections = data.connections ?? []
  }

  if (eventsRes.ok) {
    const data = await eventsRes.json() as { events?: AuditEvent[] }
    events = data.events ?? []
  }

  return { connections, events }
}
