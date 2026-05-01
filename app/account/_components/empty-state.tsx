import type { ReactNode } from "react"

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="px-5 py-5">
      <p className="text-sm text-[var(--jelly-fg-3)]">{children}</p>
    </div>
  )
}
