import packageJson from "@/package.json"

const VERSION = packageJson.version

interface Props {
  issuer: string
}

export function BottomBar({ issuer }: Props) {
  return (
    <footer className="shrink-0 border-t border-[var(--jelly-border-subtle)] bg-[var(--jelly-bg-subtle)]">
      <div className="flex h-10 w-full items-center justify-between px-4 sm:px-5 lg:px-6">
        <span className="font-mono text-[11px] text-[var(--jelly-fg-4)]">
          {issuer}
        </span>
        <span className="font-mono text-[11px] text-[var(--jelly-fg-4)]">
          v{VERSION}
        </span>
      </div>
    </footer>
  )
}
