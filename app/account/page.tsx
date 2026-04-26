import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { config } from "@/lib/config"
import { getSession } from "@/lib/session"
import { ConnectedApps } from "./connected-apps"
import { RecentActivity } from "./recent-activity"

export default async function Account() {
  const session = await getSession()
  if (!session.sub) redirect("/")

  const issuer = new URL(config.authgate.issuer).hostname
  const initials = session.name?.[0]?.toUpperCase()
    ?? session.email?.[0]?.toUpperCase()
    ?? "U"

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-[var(--account-bg)]">
      <header
        className="sticky top-0 z-10 h-13 sm:h-14 lg:h-14 shrink-0"
        style={{
          background: "rgba(250,251,252,0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--jelly-border-subtle)",
        }}
      >
        <div className="mx-auto flex h-full w-full max-w-[880px] items-center justify-between gap-3 px-4 sm:max-w-[720px] sm:px-5 lg:max-w-[880px] lg:px-6">
          <div className="min-w-0 flex items-center gap-2 font-mono text-xs">
            <span className="truncate font-semibold text-[var(--account-brand)]">project-jelly.io</span>
            <span className="shrink-0 text-[var(--account-text-muted)]">/</span>
            <span className="truncate text-[var(--account-text-secondary)]">account</span>
          </div>
          <div className="shrink-0 flex items-center gap-3">
            <div
              className="flex size-7 items-center justify-center rounded-full bg-[var(--account-brand)] text-xs font-semibold text-white"
              title={session.email}
            >
              {initials}
            </div>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="cursor-pointer rounded-[var(--jelly-radius-md)] border border-[var(--jelly-border-std)] bg-white px-3 py-1.5 text-[13px] font-medium text-[var(--jelly-fg-1)] shadow-[var(--jelly-shadow-subtle)] transition-colors hover:bg-[var(--jelly-bg-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--account-focus-ring)]"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-full flex-col gap-3 px-4 py-4 sm:max-w-[720px] sm:gap-4 sm:px-5 sm:py-5 lg:max-w-[880px] lg:px-6 lg:py-6">
          <Section title="Me">
            <div className="px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[image:var(--jelly-gradient-blob)] text-sm font-semibold text-white">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--account-text-primary)]">
                    {session.name || session.email || "Account"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-[var(--account-text-secondary)]">
                    {session.email}
                  </p>
                </div>
                <StatusBadge>active</StatusBadge>
              </div>

              <hr className="my-4 border-[var(--account-border)]" />

              <div className="space-y-2">
                <MetaRow label="sub" value={session.sub} />
                <MetaRow label="issuer" value={issuer} />
              </div>
            </div>
          </Section>

          <Section title="Connected apps">
            <ConnectedApps compact ownClientId={config.authgate.clientId} />
          </Section>

          <Section title="Recent activity">
            <RecentActivity compact limit={12} />
          </Section>
        </div>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[var(--jelly-radius-lg)] border border-[var(--jelly-border-std)] bg-[var(--jelly-bg-surface)] shadow-[var(--jelly-shadow-card)]">
      <div className="border-b border-[var(--jelly-border-subtle)] px-3.5 py-3.5">
        <h2 className="jelly-tiny-upper">
          {title}
        </h2>
      </div>
      {children}
    </section>
  )
}

function StatusBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--jelly-border-std)] bg-white px-3 py-1 text-xs font-medium text-[var(--jelly-fg-2)] shadow-[var(--jelly-shadow-subtle)]">
      <span className="size-1.5 rounded-full bg-[var(--jelly-green)]" />
      {children}
    </span>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="jelly-mono flex items-center justify-between gap-3">
      <span className="shrink-0 text-[var(--jelly-fg-4)]">{label}</span>
      <span className="truncate text-right text-[var(--jelly-fg-2)]">{value}</span>
    </div>
  )
}
