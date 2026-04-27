import Image from "next/image"

export default function Home() {
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
        <div className="flex h-full items-center justify-between px-4 sm:px-6">
          <div className="font-mono text-xs font-semibold text-[var(--account-brand)]">
            authgate account
          </div>
          <div />
        </div>
      </header>

      <main className="relative flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 40%, rgba(167,139,255,0.08) 0%, transparent 70%)",
          }}
        />

        <div className="relative w-full max-w-md space-y-7 text-center">
          <Image
            src="/logo.png"
            alt="authgate account"
            width={96}
            height={96}
            className="mx-auto rounded-2xl"
            priority
          />

          <div className="space-y-3">
            <h1 className="text-[28px] font-semibold tracking-tight text-[var(--jelly-fg-1)]">
              Manage connected services
            </h1>
            <p className="text-sm leading-relaxed text-[var(--jelly-fg-3)]">
              See which services can access your authgate account and revoke connections you no longer use.
            </p>
          </div>

          <a
            href="/api/auth/login"
            className="block w-full rounded-[var(--jelly-radius-md)] bg-[var(--jelly-brand-deep)] px-5 py-3 text-white shadow-[var(--jelly-shadow-card)] transition-colors hover:bg-[var(--jelly-brand-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--account-focus-ring)]"
          >
            <div className="text-sm font-medium">Continue with authgate</div>
            <div className="mt-0.5 text-xs text-white/70">Sign in via Google</div>
          </a>

          <p className="text-xs text-[var(--jelly-fg-4)]">
            No account deletion here.
          </p>
        </div>
      </main>
    </div>
  )
}
