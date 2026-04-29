import type { ReactNode } from "react"

interface Props {
  right?: ReactNode
}

export function TopBar({ right }: Props) {
  return (
    <header
      className="sticky top-0 z-10 h-13 shrink-0 sm:h-14"
      style={{
        background: "rgba(250,251,252,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--jelly-border-subtle)",
      }}
    >
      <div className="flex h-full w-full items-center justify-between gap-3 px-4 sm:px-5 lg:px-6">
        <div className="shrink-0 font-mono text-xs font-semibold text-[var(--account-brand)]">
          authgate account
        </div>
        {right ? (
          <div className="flex min-w-0 items-center gap-3">{right}</div>
        ) : null}
      </div>
    </header>
  )
}
