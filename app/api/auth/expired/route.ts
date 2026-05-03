import { NextResponse } from "next/server"
import { config as env } from "@/lib/env"
import { isSameOrigin } from "@/lib/auth/csrf"
import { tryRefresh } from "@/lib/auth/refresh"
import { getSession } from "@/lib/auth/session"

// Server Components can't write cookies. When a Server Component sees a 401
// from authgate (rare race with the proxy refresh), it redirects here.
//
// We try refresh first — clock skew or a just-rotated token shouldn't kick
// the user out. Only destroy if the refresh actually fails.
export async function GET(req: Request) {
  if (!isSameOrigin(req)) return new NextResponse(null, { status: 403 })

  const session = await getSession()
  if (await tryRefresh(session)) {
    return NextResponse.redirect(new URL("/account", env.appUrl))
  }

  await session.destroy()
  return NextResponse.redirect(new URL("/", env.appUrl))
}
