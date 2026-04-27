import { redirect } from "next/navigation"
import { config } from "@/lib/config"
import { getSession } from "@/lib/session"
import { AccountTabs } from "./account-tabs"

export default async function Account() {
  const session = await getSession()
  if (!session.sub) redirect("/")

  const issuer = new URL(config.authgate.issuer).hostname
  const accountSession = {
    sub: session.sub,
    email: session.email,
    name: session.name,
  }

  return (
    <div className="h-dvh flex flex-col bg-[var(--account-bg)]">
      <header
        className="sticky top-0 z-10 h-13 shrink-0 sm:h-14"
        style={{
          background: "rgba(250,251,252,0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--jelly-border-subtle)",
        }}
      >
        <div className="mx-auto flex h-full w-full max-w-[1100px] items-center justify-between gap-3 px-4 sm:px-5 lg:px-6">
          <div className="shrink-0 font-mono text-xs font-semibold text-[var(--account-brand)]">
            authgate account
          </div>
          <div className="flex min-w-0 items-center gap-3">
            <span className="max-w-[200px] truncate font-mono text-xs text-[var(--jelly-fg-3)]">
              {session.email}
            </span>
            <form action="/api/auth/logout" method="POST" className="shrink-0">
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

      <AccountTabs
        session={accountSession}
        issuer={issuer}
        ownClientId={config.authgate.clientId}
      />
    </div>
  )
}
