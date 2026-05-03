import { NextRequest, NextResponse } from "next/server"
import { getIronSession } from "iron-session"
import { tryRefresh } from "@/lib/auth/refresh"
import { sessionOptions, type SessionData } from "@/lib/auth/session"

const REFRESH_BUFFER_SECONDS = 30

// Page requests get a redirect; API requests get a 401 so the browser fetch
// doesn't auto-follow into HTML and confuse the client-side handler.
function unauthorized(req: NextRequest, res: NextResponse): NextResponse {
  const isApi = req.nextUrl.pathname.startsWith("/api/")
  const out = isApi
    ? new NextResponse(null, { status: 401 })
    : NextResponse.redirect(new URL("/", process.env.APP_URL ?? req.url))
  for (const cookie of res.headers.getSetCookie()) {
    out.headers.append("set-cookie", cookie)
  }
  return out
}

export async function proxy(req: NextRequest) {
  const res = NextResponse.next()
  const session = await getIronSession<SessionData>(req, res, sessionOptions())

  if (!session.sub) {
    return unauthorized(req, res)
  }

  const now = Math.floor(Date.now() / 1000)
  const needsRefresh = !session.expiresAt || now >= session.expiresAt - REFRESH_BUFFER_SECONDS

  if (needsRefresh) {
    if (!(await tryRefresh(session))) {
      await session.destroy()
      return unauthorized(req, res)
    }
  }

  return res
}

export const config = {
  matcher: ["/account/:path*", "/api/account/:path*"],
}
