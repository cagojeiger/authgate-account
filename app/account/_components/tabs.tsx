"use client"

import { useState } from "react"
import { ConnectedApps } from "./connected-apps"
import { OverviewTab } from "./overview"
import { RecentActivity } from "./recent-activity"

type TabId = "overview" | "services" | "activity"

interface AccountSession {
  sub: string
  email: string
  name: string
}

interface Props {
  session: AccountSession
  issuer: string
  ownClientId: string
}

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "services", label: "Services" },
  { id: "activity", label: "Activity" },
]

export function AccountTabs({ session, issuer, ownClientId }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("services")

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-[var(--jelly-border-subtle)]">
        <div
          role="tablist"
          aria-label="Account sections"
          className="mx-auto flex w-full max-w-[1100px] px-4 sm:px-5 lg:px-6"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`${tab.id}-panel`}
                onClick={() => setActiveTab(tab.id)}
                className={`-mb-[1px] cursor-pointer border-b-2 px-4 py-3 font-mono text-sm transition-colors ${
                  isActive
                    ? "border-[var(--jelly-brand-deep)] text-[var(--jelly-fg-1)]"
                    : "border-transparent text-[var(--jelly-fg-3)] hover:text-[var(--jelly-fg-1)]"
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <main id={`${activeTab}-panel`} role="tabpanel" className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1100px] px-4 py-6 sm:px-5 sm:py-8 lg:px-6">
          {activeTab === "overview" && <OverviewTab session={session} issuer={issuer} />}
          {activeTab === "services" && <ConnectedApps ownClientId={ownClientId} />}
          {activeTab === "activity" && <RecentActivity />}
        </div>
      </main>
    </div>
  )
}
