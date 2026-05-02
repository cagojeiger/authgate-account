import { redirect } from "next/navigation"
import { BottomBar } from "@/components/bottom-bar"
import { TopBar } from "@/components/top-bar"
import { config } from "@/lib/env"
import { getSession } from "@/lib/auth/session"
import { AccountTabs } from "./_components/tabs"

export default async function Account() {
  const session = await getSession()
  if (!session.sub) redirect("/")

  const issuer = new URL(config.authgate.issuer).hostname
  const accountSession = {
    sub: session.sub,
    email: session.email,
    name: session.name,
  }

  const right = (
    <>
      {session.email && (
        <span className="max-w-[200px] truncate font-mono text-xs text-[var(--jelly-fg-3)]">
          {session.email}
        </span>
      )}
      <form action="/api/auth/logout" method="POST" className="shrink-0">
        <button
          type="submit"
          className="cursor-pointer rounded-[var(--jelly-radius-md)] border border-[var(--jelly-border-std)] bg-white px-3 py-1.5 text-[13px] font-medium text-[var(--jelly-fg-1)] shadow-[var(--jelly-shadow-subtle)] transition-colors hover:bg-[var(--jelly-bg-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--account-focus-ring)]"
        >
          Sign out
        </button>
      </form>
    </>
  )

  return (
    <div className="h-dvh flex flex-col bg-[var(--account-bg)]">
      <TopBar right={right} />

      <AccountTabs
        session={accountSession}
        issuer={issuer}
        ownClientId={config.authgate.clientId}
      />

      <BottomBar issuer={issuer} />
    </div>
  )
}
