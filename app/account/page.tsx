import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { config } from "@/lib/config"
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
    <div className="h-dvh flex flex-col overflow-hidden bg-background">

      {/* Topbar */}
      <header
        className="shrink-0 flex items-center justify-between px-6 h-14 bg-card"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
          <span style={{ color: "var(--jelly-brand-deep)", fontWeight: 600 }}>project-jelly.io</span>
          <span style={{ color: "var(--jelly-fg-4)" }}>/</span>
          <span style={{ color: "var(--jelly-fg-3)" }}>account</span>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white"
            style={{ background: "var(--jelly-gradient-blob)" }}
            title={session.email}
          >
            {initials}
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="text-xs font-medium px-2 py-1 rounded-md transition-colors hover:bg-secondary cursor-pointer"
              style={{ color: "var(--jelly-fg-3)" }}
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      {/* Bento grid */}
      <div className="flex-1 min-h-0 flex">
        <main className="flex-1 min-w-0 min-h-0 p-4 grid grid-cols-12 grid-rows-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4 overflow-hidden">

          {/* Identity */}
          <div
            className="col-span-5 row-span-1 min-h-0 flex flex-col rounded-xl overflow-hidden bg-card"
            style={{ border: "1px solid var(--border)", boxShadow: "var(--jelly-shadow-card)" }}
          >
            <CardHeader title="Identity" />
            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
              {/* Profile */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0"
                  style={{ background: "var(--jelly-gradient-blob)" }}
                >
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--jelly-fg-1)" }}>
                    {session.name || session.email || "Account"}
                  </p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: "var(--jelly-fg-3)" }}>
                    {session.email}
                  </p>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "var(--jelly-green)",
                    background: "var(--jelly-green-soft)",
                    border: "1px solid rgba(31,158,74,0.18)",
                  }}
                >
                  active
                </span>
              </div>

              <div style={{ borderTop: "1px solid var(--border)" }} />

              {/* Meta */}
              <div className="space-y-2">
                <MetaRow label="sub" value={session.sub} />
                <MetaRow label="issuer" value={issuer} />
              </div>
            </div>
          </div>

          {/* Connected apps */}
          <div
            className="col-span-7 row-span-1 min-h-0 flex flex-col rounded-xl overflow-hidden bg-card"
            style={{ border: "1px solid var(--border)", boxShadow: "var(--jelly-shadow-card)" }}
          >
            <CardHeader title="Connected apps" meta="Only signed-in services shown" />
            <div className="flex-1 min-h-0 overflow-y-auto">
              <ConnectedApps compact />
            </div>
          </div>

          {/* Recent activity — full width */}
          <div
            className="col-span-12 row-span-1 min-h-0 flex flex-col rounded-xl overflow-hidden bg-card"
            style={{ border: "1px solid var(--border)", boxShadow: "var(--jelly-shadow-card)" }}
          >
            <CardHeader title="Recent activity" />
            <div className="flex-1 min-h-0 overflow-y-auto">
              <RecentActivity compact limit={12} />
            </div>
          </div>

        </main>
      </div>

      {/* Footer */}
      <footer
        className="shrink-0 flex items-center justify-between px-6 py-2.5"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--jelly-fg-4)" }}>project-jelly.io</span>
        <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--jelly-fg-4)" }}>authgate-account</span>
      </footer>

    </div>
  )
}

function CardHeader({ title, meta }: { title: string; meta?: string }) {
  return (
    <div
      className="shrink-0 flex items-center justify-between px-5 py-3"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <h2 className="text-xs font-semibold" style={{ fontFamily: "var(--font-mono)", color: "var(--jelly-fg-2)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
        {title}
      </h2>
      {meta && (
        <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--jelly-fg-4)" }}>
          {meta}
        </span>
      )}
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs shrink-0" style={{ fontFamily: "var(--font-mono)", color: "var(--jelly-fg-4)" }}>{label}</span>
      <span className="text-xs text-right truncate" style={{ fontFamily: "var(--font-mono)", color: "var(--jelly-fg-2)" }}>{value}</span>
    </div>
  )
}
