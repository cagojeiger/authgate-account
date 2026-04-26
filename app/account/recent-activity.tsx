"use client"

import { useEffect, useState } from "react"

interface AuditEvent {
  id: number
  event_type: string
  ip_address: string
  user_agent: string
  metadata: Record<string, unknown>
  created_at: string
}

const EVENT_COLOR: Record<string, string> = {
  "auth.login":              "var(--jelly-green)",
  "auth.signup":             "var(--jelly-brand-deep)",
  "auth.logout":             "var(--jelly-fg-3)",
  "auth.token_revoked":      "#d97706",
  "auth.connection_revoked": "var(--jelly-red, #e0365b)",
  "auth.session_revoked":    "var(--jelly-fg-3)",
  "token.refresh":           "var(--jelly-fg-4)",
}

function groupByDate(events: AuditEvent[]) {
  const groups: { label: string; events: AuditEvent[] }[] = []
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  for (const e of events) {
    const d = new Date(e.created_at).toDateString()
    const label = d === today ? "Today" : d === yesterday ? "Yesterday" : new Date(e.created_at).toLocaleDateString()
    const last = groups[groups.length - 1]
    if (last?.label === label) last.events.push(e)
    else groups.push({ label, events: [e] })
  }
  return groups
}

export function RecentActivity({ compact, limit = 20 }: { compact?: boolean; limit?: number }) {
  const [events, setEvents] = useState<AuditEvent[] | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const pageLimit = compact ? limit : 20

  const load = (p: number, append = false) => {
    fetch(`/api/account/audit-log?page=${p}&limit=${pageLimit}`)
      .then((r) => r.json())
      .then((data) => {
        setEvents((prev) => append ? [...(prev ?? []), ...(data.events ?? [])] : (data.events ?? []))
        setTotal(data.total ?? 0)
        setPage(p)
      })
      .catch(() => setEvents([]))
  }

  useEffect(() => { load(1) }, [])

  if (events === null) return <EmptyState>Loading…</EmptyState>
  if (events.length === 0) return <EmptyState>No events yet.</EmptyState>

  const groups = groupByDate(events)
  const hasMore = !compact && events.length < total

  return (
    <div>
      {groups.map((group, gi) => (
        <div key={group.label}>
          {/* Date group header */}
          <div className="px-5 py-1.5" style={{ background: "var(--secondary)", borderBottom: "1px solid var(--border)" }}>
            <span className="text-xs font-medium" style={{ fontFamily: "var(--font-mono)", color: "var(--jelly-fg-3)" }}>
              {group.label}
            </span>
          </div>
          {group.events.map((e, i) => (
            <div
              key={e.id}
              className="flex items-start justify-between px-5 py-3 gap-3 transition-colors hover:bg-accent"
              style={gi < groups.length - 1 || i < group.events.length - 1 ? { borderBottom: "1px solid var(--border)" } : {}}
            >
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <span
                  className="shrink-0 w-1.5 h-1.5 rounded-full mt-1"
                  style={{ background: EVENT_COLOR[e.event_type] ?? "var(--jelly-fg-4)" }}
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium" style={{ fontFamily: "var(--font-mono)", color: "var(--jelly-fg-2)" }}>
                    {e.event_type}
                  </p>
                  <p className="text-xs truncate mt-0.5" style={{ fontFamily: "var(--font-mono)", color: "var(--jelly-fg-4)" }}>
                    {e.ip_address ? e.ip_address.replace(/\/\d+$/, "") : "—"}
                    {e.metadata?.client_id ? ` · ${e.metadata.client_id}` : ""}
                  </p>
                </div>
              </div>
              <p className="text-xs shrink-0" style={{ fontFamily: "var(--font-mono)", color: "var(--jelly-fg-4)" }}>
                {new Date(e.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          ))}
        </div>
      ))}

      {/* Load more — only in non-compact mode */}
      {hasMore && (
        <div className="px-5 py-3 flex justify-center" style={{ borderTop: "1px solid var(--border)" }}>
          <button
            onClick={() => load(page + 1, true)}
            className="text-xs font-medium px-4 py-1.5 rounded-lg transition-colors"
            style={{ color: "var(--jelly-brand-deep)", background: "var(--accent)", border: "1px solid var(--border)" }}
          >
            Load more ({total - events.length} remaining)
          </button>
        </div>
      )}

      {/* Compact: show total count */}
      {compact && total > events.length && (
        <div className="px-5 py-3" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--jelly-fg-4)" }}>
            +{total - events.length} more events
          </p>
        </div>
      )}
    </div>
  )
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 py-4">
      <p className="text-sm" style={{ color: "var(--jelly-fg-3)" }}>{children}</p>
    </div>
  )
}
