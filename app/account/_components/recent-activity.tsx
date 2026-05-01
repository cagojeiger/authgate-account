"use client"

import { useCallback, useEffect, useState } from "react"
import { EmptyState } from "./empty-state"

interface AuditEvent {
  id: number
  event_type: string
  ip_address: string
  user_agent: string
  metadata: Record<string, unknown>
  created_at: string
}

interface AuditLogResponse {
  events?: AuditEvent[]
}

const EVENT_COLOR: Record<string, string> = {
  "auth.login":              "var(--jelly-green)",
  "auth.signup":             "var(--jelly-brand-deep)",
  "auth.logout":             "var(--jelly-fg-3)",
  "auth.token_revoked":      "var(--jelly-amber)",
  "auth.connection_revoked": "var(--jelly-red)",
  "auth.session_revoked":    "var(--jelly-fg-3)",
  "token.refresh":           "var(--jelly-fg-4)",
}

function groupByDate(events: AuditEvent[]) {
  const groups: { label: string; events: AuditEvent[] }[] = []
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()

  for (const e of events) {
    const eventDate = new Date(e.created_at)
    const d = eventDate.toDateString()
    const label = d === today
      ? "Today"
      : d === yesterday
        ? "Yesterday"
        : `${String(eventDate.getDate()).padStart(2, "0")} ${eventDate.toLocaleString("en-US", { month: "short" })}`
    const last = groups[groups.length - 1]

    if (last?.label === label) last.events.push(e)
    else groups.push({ label, events: [e] })
  }

  return groups
}

export function RecentActivity() {
  const [events, setEvents] = useState<AuditEvent[] | null>(null)
  const [loadError, setLoadError] = useState(false)

  const load = useCallback(async () => {
    setLoadError(false)

    try {
      const res = await fetch("/api/account/audit-log")
      if (res.status === 401) {
        window.location.replace("/")
        return
      }
      if (!res.ok) throw new Error("Could not load recent activity")

      const data = await res.json() as AuditLogResponse
      setEvents(data.events ?? [])
    } catch {
      setLoadError(true)
      setEvents([])
    }
  }, [])

  useEffect(() => {
    // Defer to next tick so setState in `load` runs outside the effect body
    // (react-hooks/set-state-in-effect).
    const timer = window.setTimeout(() => {
      void load()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [load])

  const groups = groupByDate(events ?? [])

  return (
    <section className="overflow-hidden rounded-[var(--jelly-radius-lg)] border border-[var(--jelly-border-std)] bg-[var(--jelly-bg-surface)] shadow-[var(--jelly-shadow-card)]">
      <div className="border-b border-[var(--jelly-border-subtle)] px-5 py-3.5">
        <h2 className="jelly-tiny-upper">Activity</h2>
      </div>

      {events === null && <SkeletonRows />}
      {events !== null && loadError && <EmptyState>Could not load recent activity.</EmptyState>}
      {events !== null && !loadError && events.length === 0 && (
        <EmptyState>No recent activity.</EmptyState>
      )}
      {events !== null && !loadError && events.length > 0 && (
        <div>
          {groups.map((group, gi) => (
            <div key={group.label}>
              <div className="border-b border-[var(--jelly-border-subtle)] bg-[var(--jelly-bg-subtle)] px-5 py-1.5">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--jelly-fg-3)]">
                  {group.label}
                </span>
              </div>
              {group.events.map((e, i) => {
                const clientId = typeof e.metadata?.client_id === "string" ? e.metadata.client_id : ""
                const ip = e.ip_address ? e.ip_address.replace(/\/\d+$/, "") : ""
                const time = new Date(e.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })

                return (
                  <div
                    key={e.id}
                    className="px-5 py-2.5"
                    style={gi < groups.length - 1 || i < group.events.length - 1 ? { borderBottom: "1px solid var(--jelly-border-subtle)" } : {}}
                  >
                    <div className="jelly-mono hidden min-w-0 items-center gap-2 text-[var(--jelly-fg-4)] sm:flex">
                      <span
                        className="size-1.5 shrink-0 rounded-full"
                        style={{ background: EVENT_COLOR[e.event_type] ?? "var(--jelly-fg-4)" }}
                      />
                      <span className="shrink-0 font-medium text-[var(--jelly-fg-2)]">{e.event_type}</span>
                      {clientId && <span className="truncate">{clientId}</span>}
                      {ip && (
                        <>
                          <span className="shrink-0">·</span>
                          <span className="shrink-0">{ip}</span>
                        </>
                      )}
                      <span className="ml-auto shrink-0">{time}</span>
                    </div>

                    <div className="jelly-mono min-w-0 sm:hidden">
                      <div className="flex items-center gap-2">
                        <span
                          className="size-1.5 shrink-0 rounded-full"
                          style={{ background: EVENT_COLOR[e.event_type] ?? "var(--jelly-fg-4)" }}
                        />
                        <span className="min-w-0 flex-1 truncate font-medium text-[var(--jelly-fg-2)]">
                          {e.event_type}
                        </span>
                        <span className="shrink-0 text-[var(--jelly-fg-4)]">{time}</span>
                      </div>
                      {clientId && (
                        <p className="mt-1 truncate pl-3.5 text-[var(--jelly-fg-4)]">
                          {clientId}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function SkeletonRows() {
  return (
    <div>
      {[0, 1, 2, 3].map((row) => (
        <div
          key={row}
          className="px-5 py-2.5"
          style={row < 3 ? { borderBottom: "1px solid var(--jelly-border-subtle)" } : {}}
        >
          <div className="h-4 w-full animate-pulse rounded bg-[var(--jelly-bg-muted)]" />
        </div>
      ))}
    </div>
  )
}
