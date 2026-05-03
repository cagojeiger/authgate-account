import { NextResponse } from "next/server"
import { config as env } from "@/lib/env"
import { tryRefresh } from "@/lib/auth/refresh"
import { getSession } from "@/lib/auth/session"

// Server Components can't write cookies. When a Server Component sees a 401
// from authgate (rare race with the proxy refresh), it redirects here. We
// try refresh first; only destroy if refresh actually fails.
//
// CSRF: for a recovery route the threat model is small (worst case: forced
// logout). Sec-Fetch-Site=none happens on top-level navigations including
// server-side redirects from a same-origin page, so we accept it here. Only
// reject explicit cross-site invocations (typical CSRF vector).
function isAcceptableOrigin(req: Request): boolean {
  const sfs = req.headers.get("sec-fetch-site")
  if (sfs === "cross-site" || sfs === "same-site") return false
  return true
}

export async function GET(req: Request) {
  if (!isAcceptableOrigin(req)) return new NextResponse(null, { status: 403 })

  const session = await getSession()
  if (await tryRefresh(session)) {
    return NextResponse.redirect(new URL("/account", env.appUrl))
  }

  console.error("[expired] tryRefresh failed - destroying session", {
    hadRefreshToken: !!session.refreshToken,
  })
  await session.destroy()
  return NextResponse.redirect(new URL("/", env.appUrl))
}
