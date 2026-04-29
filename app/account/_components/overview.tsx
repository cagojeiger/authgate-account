interface AccountSession {
  email: string
  name: string
}

interface Props {
  session: AccountSession
  issuer: string
}

export function OverviewTab({ session, issuer }: Props) {
  return (
    <section className="overflow-hidden rounded-[var(--jelly-radius-lg)] border border-[var(--jelly-border-std)] bg-[var(--jelly-bg-surface)] shadow-[var(--jelly-shadow-card)]">
      <div className="border-b border-[var(--jelly-border-subtle)] px-5 py-3.5">
        <h2 className="jelly-tiny-upper">Overview</h2>
      </div>

      <div className="px-5 py-5">
        <dl className="space-y-4">
          <DefinitionRow label="Email" value={session.email} />
          <DefinitionRow label="Name" value={session.name || "Not provided"} />
          <div className="flex items-center justify-between gap-4">
            <dt className="font-mono text-xs text-[var(--jelly-fg-4)]">Status</dt>
            <dd>
              <StatusBadge>active</StatusBadge>
            </dd>
          </div>
        </dl>

        <p className="mt-5 text-sm text-[var(--jelly-fg-3)]" title={issuer}>
          This account is managed by authgate.
        </p>
      </div>
    </section>
  )
}

function DefinitionRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="shrink-0 font-mono text-xs text-[var(--jelly-fg-4)]">{label}</dt>
      <dd className="min-w-0 truncate text-right text-sm font-medium text-[var(--jelly-fg-1)]">
        {value}
      </dd>
    </div>
  )
}

function StatusBadge({ children }: { children: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--jelly-border-std)] bg-white px-3 py-1 text-xs font-medium text-[var(--jelly-fg-2)] shadow-[var(--jelly-shadow-subtle)]">
      <span className="size-1.5 rounded-full bg-[var(--jelly-green)]" />
      {children}
    </span>
  )
}
