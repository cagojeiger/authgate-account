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
      <header className="sticky top-0 z-10 h-13 sm:h-14 lg:h-14 shrink-0 border-b border-[var(--account-border)] bg-[var(--account-surface)]">
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
                className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-[var(--account-text-secondary)] transition-colors hover:bg-[var(--account-brand-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--account-focus-ring)]"
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
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--account-brand)] text-sm font-semibold text-white">
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
    <section className="overflow-hidden rounded-lg border border-[var(--account-border)] bg-[var(--account-surface)]">
      <div className="border-b border-[var(--account-border)] px-4 py-3">
        <h2 className="font-mono text-xs font-semibold uppercase text-[var(--account-text-secondary)]">
          {title}
        </h2>
      </div>
      {children}
    </section>
  )
}

function StatusBadge({ children }: { children: ReactNode }) {
  return (
    <span className="shrink-0 rounded-full border border-[rgba(31,158,74,0.18)] bg-[var(--account-current-soft)] px-2 py-0.5 font-mono text-[10px] text-[var(--account-current)]">
      {children}
    </span>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 font-mono text-xs">
      <span className="shrink-0 text-[var(--account-text-muted)]">{label}</span>
      <span className="truncate text-right text-[var(--account-text-secondary)]">{value}</span>
    </div>
  )
}
