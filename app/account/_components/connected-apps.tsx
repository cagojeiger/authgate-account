"use client"

import { useCallback, useEffect, useState } from "react"
import { EmptyState } from "./empty-state"

interface Connection {
  client_id: string
  name: string
  url?: string | null
  scopes: string[]
  last_used: string
}

interface ConnectionsResponse {
  connections?: Connection[]
}

interface Props {
  ownClientId?: string
}

export function ConnectedApps({ ownClientId }: Props) {
  const [connections, setConnections] = useState<Connection[] | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [modalApp, setModalApp] = useState<Connection | null>(null)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoadError(false)

    try {
      const res = await fetch("/api/account/connections")
      if (res.status === 401) {
        window.location.assign("/")
        return
      }
      if (!res.ok) throw new Error("Could not load connected services")

      const data = await res.json() as ConnectionsResponse
      setConnections(data.connections ?? [])
    } catch {
      setLoadError(true)
      setConnections([])
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

  const disconnect = async (svc: Connection) => {
    setDisconnecting(svc.client_id)

    try {
      const res = await fetch(`/api/account/connections/${svc.client_id}`, { method: "DELETE" })
      if (res.status === 401) {
        window.location.assign("/")
        return
      }
    } finally {
      setModalApp(null)
      setDisconnecting(null)
      await load()
    }
  }

  const count = connections?.length ?? 0

  return (
    <section className="overflow-hidden rounded-[var(--jelly-radius-lg)] border border-[var(--jelly-border-std)] bg-[var(--jelly-bg-surface)] shadow-[var(--jelly-shadow-card)]">
      <div className="flex items-center justify-between border-b border-[var(--jelly-border-subtle)] px-5 py-3.5">
        <h2 className="jelly-tiny-upper">Connected Services</h2>
        <span className="font-mono text-xs text-[var(--jelly-fg-4)]">
          {count} {count === 1 ? "app" : "apps"}
        </span>
      </div>

      {connections === null && <SkeletonRows />}
      {connections !== null && loadError && <EmptyState>Could not load connected apps.</EmptyState>}
      {connections !== null && !loadError && connections.length === 0 && (
        <EmptyState>No connected apps.</EmptyState>
      )}
      {connections !== null && !loadError && connections.length > 0 && (
        <div>
          {connections.map((svc, i) => {
            const isSelf = svc.client_id === ownClientId
            const isBusy = disconnecting === svc.client_id

            return (
              <div
                key={svc.client_id}
                className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-[var(--jelly-bg-subtle)]"
                style={i < connections.length - 1 ? { borderBottom: "1px solid var(--jelly-border-subtle)" } : {}}
              >
                <span
                  className="mt-2 size-1.5 shrink-0 rounded-full"
                  style={{
                    background: isSelf ? "var(--jelly-brand-deep)" : "var(--jelly-green)",
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="min-w-0 truncate text-sm font-medium text-[var(--jelly-fg-1)]">
                      {svc.name}
                    </span>
                    {isSelf && <CurrentBadge />}
                  </div>

                  <p className="mt-1 truncate font-mono text-xs text-[var(--jelly-fg-4)]">
                    {svc.url ?? svc.client_id}
                  </p>

                  {svc.scopes.length > 0 && (
                    <p className="mt-1 truncate font-mono text-[11px] text-[var(--jelly-fg-4)]">
                      {svc.scopes.join(" · ")}
                    </p>
                  )}

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate font-mono text-xs text-[var(--jelly-fg-4)]">
                      {svc.last_used ? `last used ${formatRelative(svc.last_used)}` : "never used"}
                    </span>
                    {!isSelf && (
                      <div className="flex shrink-0 items-center gap-1.5">
                        {svc.url && (
                          <a
                            href={svc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-[var(--jelly-radius-md)] px-2 py-1 text-xs font-medium text-[var(--jelly-brand-deep)] transition-colors hover:bg-[var(--jelly-brand-soft)]"
                          >
                            Open ↗
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setModalApp(svc)}
                          disabled={isBusy}
                          className="cursor-pointer rounded-[var(--jelly-radius-md)] border border-[var(--jelly-border-std)] bg-white px-2 py-1 text-xs font-medium text-[var(--jelly-red)] shadow-[var(--jelly-shadow-subtle)] transition-colors hover:bg-[rgba(224,54,91,0.04)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isBusy ? "Revoking" : "Revoke"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[rgba(10,11,30,0.50)]"
            onClick={() => setModalApp(null)}
          />
          <div className="relative mx-4 w-full max-w-md rounded-[var(--jelly-radius-xl)] bg-white p-6 shadow-[var(--jelly-shadow-dialog)]">
            <h3 className="text-lg font-semibold text-[var(--jelly-fg-1)]">
              Revoke connection
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--jelly-fg-3)]">
              Disconnect <strong className="font-semibold text-[var(--jelly-fg-1)]">{modalApp.name}</strong>? Revokes refresh token. Your authgate account will not be deleted.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalApp(null)}
                disabled={disconnecting === modalApp.client_id}
                className="cursor-pointer rounded-[var(--jelly-radius-md)] border border-[var(--jelly-border-std)] bg-white px-3 py-1.5 text-[13px] font-medium text-[var(--jelly-fg-1)] shadow-[var(--jelly-shadow-subtle)] transition-colors hover:bg-[var(--jelly-bg-subtle)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void disconnect(modalApp)}
                disabled={disconnecting === modalApp.client_id}
                className="cursor-pointer rounded-[var(--jelly-radius-md)] bg-[var(--jelly-red)] px-3 py-1.5 text-[13px] font-medium text-white shadow-[var(--jelly-shadow-subtle)] transition-[filter] hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Revoke connection
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
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

function CurrentBadge() {
  return (
    <span className="shrink-0 rounded-[var(--jelly-radius-sm)] border border-[rgba(167,139,255,0.22)] bg-[rgba(167,139,255,0.12)] px-2 py-0.5 font-mono text-[11px] font-semibold text-[var(--jelly-brand-deep)]">
      current
    </span>
  )
}

function SkeletonRows() {
  return (
    <div>
      {[0, 1].map((row) => (
        <div
          key={row}
          className="flex items-start gap-3 px-5 py-4"
          style={row === 0 ? { borderBottom: "1px solid var(--jelly-border-subtle)" } : {}}
        >
          <div className="mt-2 size-1.5 shrink-0 animate-pulse rounded-full bg-[var(--jelly-bg-muted)]" />
          <div className="min-w-0 flex-1">
            <div className="h-4 w-2/5 animate-pulse rounded bg-[var(--jelly-bg-muted)]" />
            <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-[var(--jelly-bg-muted)]" />
            <div className="mt-2 h-3 w-3/5 animate-pulse rounded bg-[var(--jelly-bg-muted)]" />
            <div className="mt-3 h-4 w-full animate-pulse rounded bg-[var(--jelly-bg-muted)]" />
          </div>
        </div>
      ))}
    </div>
  )
}
