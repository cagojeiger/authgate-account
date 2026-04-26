import Image from "next/image"

export default function Home() {
  return (
    <div
      className="flex min-h-screen flex-1 flex-col items-center justify-center overflow-hidden lg:grid lg:grid-cols-2 lg:items-stretch lg:justify-stretch"
      style={{ background: "var(--jelly-bg-canvas)" }}
    >
      <section className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-6 py-16 text-center lg:min-h-screen lg:items-start lg:px-14 lg:py-12 lg:text-left">
        {/* Subtle glow background */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 40%, rgba(167,139,255,0.08) 0%, transparent 70%)",
          }}
        />

        <main className="relative z-10 w-full max-w-sm lg:max-w-xl">
          {/* Logomark — full image (blob + jelly text) */}
          <div className="mb-6 flex justify-center lg:justify-start">
            <Image
              src="/logo.png"
              alt="project-jelly"
              width={96}
              height={96}
              className="rounded-2xl lg:size-[120px]"
              priority
            />
          </div>

          {/* Brand */}
          <p
            className="mb-2 text-xs font-semibold uppercase tracking-widest"
            style={{ fontFamily: "var(--jelly-font-mono)", color: "var(--jelly-brand-deep)" }}
          >
            project-jelly.io
          </p>
          <h1 className="mb-2 text-2xl font-semibold tracking-tight lg:hidden" style={{ color: "var(--jelly-fg-1)" }}>
            Account
          </h1>
          <p className="mb-8 text-sm leading-relaxed lg:hidden" style={{ color: "var(--jelly-fg-3)" }}>
            Sign in to manage your account<br />and connected services.
          </p>
          <p className="hidden max-w-md text-lg leading-relaxed lg:block" style={{ color: "var(--jelly-fg-3)" }}>
            See what authgate knows about your account.
          </p>

          {/* Google Sign In */}
          <a
            href="/api/auth/login"
            className="flex w-full items-center justify-center gap-2.5 rounded-[var(--jelly-radius-md)] bg-[var(--jelly-bg-surface)] px-5 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--jelly-bg-subtle)] lg:hidden"
            style={{
              color: "var(--jelly-fg-1)",
              border: "1px solid var(--jelly-border-std)",
              boxShadow: "var(--jelly-shadow-subtle)",
            }}
          >
            <GoogleIcon />
            Continue with Google
          </a>

          {/* Powered by */}
          <p
            className="mt-8 text-xs lg:hidden"
            style={{ fontFamily: "var(--jelly-font-mono)", color: "var(--jelly-fg-4)" }}
          >
            Powered by{" "}
            <span style={{ color: "var(--jelly-brand-deep)" }}>authgate</span>
          </p>
        </main>

        <footer
          className="absolute bottom-6 text-xs lg:bottom-12 lg:left-14"
          style={{ fontFamily: "var(--jelly-font-mono)", color: "var(--jelly-fg-4)" }}
        >
          authgate-account · project-jelly.io
        </footer>
      </section>

      <section className="hidden min-h-screen w-full flex-col justify-center px-14 py-12 lg:flex">
        <div className="w-full max-w-sm">
          <h2 className="mb-2 text-2xl font-semibold tracking-tight" style={{ color: "var(--jelly-fg-1)" }}>
            Sign in to your account
          </h2>
          <p className="mb-8 text-sm leading-relaxed" style={{ color: "var(--jelly-fg-3)" }}>
            Manage your authgate identity and connected apps.
          </p>

          <a
            href="/api/auth/login"
            className="flex w-full items-center justify-center gap-2.5 rounded-[var(--jelly-radius-md)] bg-[var(--jelly-bg-surface)] px-5 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--jelly-bg-subtle)]"
            style={{
              color: "var(--jelly-fg-1)",
              border: "1px solid var(--jelly-border-std)",
              boxShadow: "var(--jelly-shadow-subtle)",
            }}
          >
            <GoogleIcon />
            Continue with Google
          </a>

          <p
            className="mt-8 text-xs"
            style={{ fontFamily: "var(--jelly-font-mono)", color: "var(--jelly-fg-4)" }}
          >
            Powered by{" "}
            <span style={{ color: "var(--jelly-brand-deep)" }}>authgate</span>
          </p>
        </div>
      </section>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}
