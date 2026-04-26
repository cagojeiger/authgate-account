"use client"

import type { ReactNode } from "react"
import { useCallback, useEffect, useState, useTransition } from "react"

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
  const [loadError, setLoadError] = useState(false)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const load = useCallback(() => {
    setLoadError(false)
    fetch("/api/account/connections")
      .then((r) => r.json())
      .then((data) => setConnections(data.connections ?? []))
      .catch(() => {
        setLoadError(true)
        setConnections([])
      })
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(load, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const disconnect = (clientId: string) => {
    setDisconnecting(clientId)
    setConfirming(null)
    startTransition(async () => {
      await fetch(`/api/account/connections/${clientId}`, { method: "DELETE" })
      setDisconnecting(null)
      load()
    })
  }

  if (connections === null) return <SkeletonRows />
  if (loadError) return <EmptyState>Could not load connected apps.</EmptyState>
  if (connections.length === 0) return <EmptyState>No connected apps.</EmptyState>

  return (
    <div className={compact ? "" : "overflow-hidden rounded-lg border border-[var(--account-border)] bg-[var(--account-surface)]"}>
      {connections.map((svc, i) => {
        const isSelf = svc.client_id === ownClientId
        const isConfirming = confirming === svc.client_id
        const isBusy = disconnecting === svc.client_id
        return (
          <div
            key={svc.client_id}
            className="px-4 py-3.5 transition-colors hover:bg-[var(--jelly-bg-subtle)]"
            style={i < connections.length - 1 ? { borderBottom: "1px solid var(--jelly-border-subtle)" } : {}}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 truncate text-sm font-medium text-[var(--account-text-primary)]">
                {svc.name}
              </p>
              {isSelf && <CurrentBadge />}
            </div>

            <p className="mt-1 truncate font-mono text-xs text-[var(--account-text-muted)]">
              {svc.url ?? svc.client_id}
            </p>

            {svc.scopes?.length > 0 && (
              <p className="mt-1 truncate font-mono text-[11px] text-[var(--account-text-muted)]">
                {svc.scopes.join(" · ")}
              </p>
            )}

            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="min-w-0 truncate font-mono text-xs text-[var(--account-text-muted)]">
                last used {formatRelative(svc.last_used)}
              </p>
              {!isSelf && !isConfirming && (
                <div className="flex shrink-0 items-center gap-1.5">
                  {svc.url && (
                    <a
                      href={svc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-[var(--jelly-radius-md)] bg-transparent px-3 py-1.5 text-[13px] font-medium text-[var(--jelly-brand-deep)] transition-colors hover:bg-[var(--jelly-brand-soft)]"
                    >
                      Open ↗
                    </a>
                  )}
                  <button
                    onClick={() => setConfirming(svc.client_id)}
                    disabled={isBusy || isPending}
                    className="rounded-[var(--jelly-radius-md)] border border-[var(--jelly-border-std)] bg-white px-3 py-1.5 text-[13px] font-medium text-[var(--jelly-red)] shadow-[var(--jelly-shadow-subtle)] transition-colors hover:border-[rgba(224,54,91,0.22)] hover:bg-[rgba(224,54,91,0.04)] disabled:opacity-50"
                  >
                    {isBusy ? "…" : "Disconnect"}
                  </button>
                </div>
              )}
            </div>

            {isConfirming && (
              <div className="mt-3 rounded-[var(--jelly-radius-md)] border border-[var(--jelly-border-std)] bg-[var(--jelly-bg-canvas)] px-3 py-2">
                <p className="font-mono text-[11px] leading-5 text-[var(--jelly-fg-2)]">
                  ⚠ This revokes {svc.name}&apos;s refresh token. Existing access may still work up to ~15 min.
                </p>
                <div className="mt-2 flex justify-end gap-1.5">
                  <button
                    onClick={() => setConfirming(null)}
                    disabled={isPending}
                    className="rounded-[var(--jelly-radius-md)] bg-transparent px-3 py-1.5 text-[13px] font-medium text-[var(--jelly-fg-3)] transition-colors hover:bg-[var(--jelly-border-subtle)] disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => disconnect(svc.client_id)}
                    disabled={isPending}
                    className="rounded-[var(--jelly-radius-md)] bg-[var(--jelly-red)] px-3 py-1.5 text-[13px] font-medium text-white shadow-[var(--jelly-shadow-subtle)] transition-[filter] hover:brightness-95 disabled:opacity-50"
                  >
                    Confirm disconnect
                  </button>
                </div>
              </div>
            )}
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

function CurrentBadge() {
  return (
    <span className="shrink-0 rounded-[var(--jelly-radius-sm)] border border-[rgba(167,139,255,0.22)] bg-[rgba(167,139,255,0.12)] px-2 py-0.5 text-[11px] font-semibold text-[var(--jelly-brand-deep)]">
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
          className="px-4 py-3.5"
          style={row === 0 ? { borderBottom: "1px solid var(--account-border)" } : {}}
        >
          <div className="h-4 w-2/5 animate-pulse rounded bg-[var(--jelly-bg-muted)]" />
          <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-[var(--jelly-bg-muted)]" />
          <div className="mt-2 h-3 w-3/5 animate-pulse rounded bg-[var(--jelly-bg-muted)]" />
          <div className="mt-3 h-4 w-full animate-pulse rounded bg-[var(--jelly-bg-muted)]" />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="px-4 py-4">
      <p className="text-sm text-[var(--account-text-secondary)]">{children}</p>
    </div>
  )
}
