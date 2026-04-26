"use client"

import { useEffect, useState, useTransition } from "react"

interface Connection {
  client_id: string
  name: string
  url?: string
  scopes: string[]
  last_used: string
}

interface Props {
  compact?: boolean
  ownClientId?: string
}

export function ConnectedApps({ compact, ownClientId }: Props) {
  const [connections, setConnections] = useState<Connection[] | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const load = () => {
    fetch("/api/account/connections")
      .then((r) => r.json())
      .then((data) => setConnections(data.connections ?? []))
      .catch(() => setConnections([]))
  }

  useEffect(() => { load() }, [])

  const disconnect = (clientId: string) => {
    setDisconnecting(clientId)
    setConfirming(null)
    startTransition(async () => {
      await fetch(`/api/account/connections/${clientId}`, { method: "DELETE" })
      setDisconnecting(null)
      load()
    })
  }

  if (connections === null) return <EmptyState>Loading…</EmptyState>
  if (connections.length === 0) {
    return <EmptyState>No apps are currently holding access to your account.</EmptyState>
  }

  return (
    <div className={compact ? "" : "rounded-xl overflow-hidden bg-card"} style={compact ? {} : { border: "1px solid var(--border)", boxShadow: "var(--jelly-shadow-card)" }}>
      {connections.map((svc, i) => {
        const isSelf = svc.client_id === ownClientId
        const isConfirming = confirming === svc.client_id
        const isBusy = disconnecting === svc.client_id
        return (
          <div
            key={svc.client_id}
            className="flex items-start justify-between px-5 py-3.5 gap-3 transition-colors hover:bg-accent"
            style={i < connections.length - 1 ? { borderBottom: "1px solid var(--border)" } : {}}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium" style={{ color: "var(--jelly-fg-1)" }}>{svc.name}</p>
              <p className="text-xs mt-0.5 truncate" style={{ fontFamily: "var(--font-mono)", color: "var(--jelly-fg-4)" }}>
                {svc.url ?? svc.client_id}
                {svc.last_used ? ` · last used ${formatRelative(svc.last_used)}` : ""}
              </p>
              {svc.scopes?.length > 0 && (
                <p className="text-xs mt-0.5 truncate" style={{ fontFamily: "var(--font-mono)", color: "var(--jelly-fg-4)", fontSize: 10 }}>
                  {svc.scopes.join(" · ")}
                </p>
              )}
              {isConfirming && (
                <p className="text-xs mt-1.5" style={{ fontFamily: "var(--font-mono)", color: "var(--jelly-fg-3)", fontSize: 11 }}>
                  Disconnects this app. Existing access may still work up to ~15 min until its token expires. The service itself is not deleted.
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {svc.url && !isConfirming && (
                <a href={svc.url} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-medium px-2 py-1 rounded-md transition-colors"
                  style={{ color: "var(--jelly-brand-deep)" }}>
                  Open ↗
                </a>
              )}
              {isSelf ? (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "var(--jelly-green)",
                    background: "var(--jelly-green-soft)",
                    border: "1px solid rgba(31,158,74,0.18)",
                    fontSize: 10,
                  }}
                  title="You are signed in to this account page. Use the top-right Sign out button to leave."
                >
                  current
                </span>
              ) : isConfirming ? (
                <>
                  <button
                    onClick={() => setConfirming(null)}
                    disabled={isPending}
                    className="text-xs px-2 py-1 rounded-md transition-colors disabled:opacity-50"
                    style={{ color: "var(--jelly-fg-4)" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => disconnect(svc.client_id)}
                    disabled={isPending}
                    className="text-xs font-medium px-2 py-1 rounded-md transition-colors disabled:opacity-50"
                    style={{ color: "var(--jelly-red, #e0365b)" }}
                  >
                    Confirm disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirming(svc.client_id)}
                  disabled={isBusy || isPending}
                  className="text-xs px-2 py-1 rounded-md transition-colors disabled:opacity-50"
                  style={{ color: "var(--jelly-fg-4)" }}
                >
                  {isBusy ? "…" : "Disconnect"}
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function formatRelative(iso: string): string {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  if (days < 30) return `${days}d ago`
  return d.toLocaleDateString()
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 py-4">
      <p className="text-sm" style={{ color: "var(--jelly-fg-3)" }}>{children}</p>
    </div>
  )
}
