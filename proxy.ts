import { NextRequest, NextResponse } from "next/server"
import { getIronSession } from "iron-session"
import { tryRefresh } from "@/lib/auth/refresh"
import { sessionOptions, type SessionData } from "@/lib/auth/session"

const REFRESH_BUFFER_SECONDS = 30
const COOKIE_NAME = "aa_session"

// Page requests get a redirect; API requests get a 401 so the browser fetch
// doesn't auto-follow into HTML and confuse the client-side handler.
function unauthorized(req: NextRequest, res: NextResponse): NextResponse {
  const isApi = req.nextUrl.pathname.startsWith("/api/")
  const out = isApi
    ? new NextResponse(null, { status: 401 })
    : NextResponse.redirect(new URL("/", process.env.APP_URL ?? req.url))
  for (const c of res.headers.getSetCookie()) out.headers.append("set-cookie", c)
  return out
}

// After refresh, the new aa_session cookie is in res.headers.set-cookie. But
// route handlers and Server Components read cookies from the *request*
// (via cookies() / getSession()), which still has the stale value from the
// incoming request — middleware Set-Cookie only takes effect on the *next*
// request. Forward the new cookie onto the request so this same request's
// handler reads the just-rotated tokens. Without this, the handler would
// call authgate with the old (now invalid) access_token, get 401, and the
// downstream destroy-on-401 logic would log the user out.
function forwardRefreshedCookie(req: NextRequest, res: NextResponse): NextResponse {
  const setCookies = res.headers.getSetCookie()
  const refreshed = setCookies.find((c) => c.startsWith(`${COOKIE_NAME}=`))
  if (!refreshed) return res

  const newValue = refreshed.split(";", 1)[0].slice(COOKIE_NAME.length + 1)
  const cookies: string[] = []
  for (const c of req.cookies.getAll()) {
    if (c.name === COOKIE_NAME) continue
    cookies.push(`${c.name}=${c.value}`)
  }
  cookies.push(`${COOKIE_NAME}=${newValue}`)

  const headers = new Headers(req.headers)
  headers.set("cookie", cookies.join("; "))

  const forwarded = NextResponse.next({ request: { headers } })
  for (const sc of setCookies) forwarded.headers.append("set-cookie", sc)
  return forwarded
}

export async function proxy(req: NextRequest) {
  const res = NextResponse.next()
  const session = await getIronSession<SessionData>(req, res, sessionOptions())

  if (!session.sub) return unauthorized(req, res)

  const now = Math.floor(Date.now() / 1000)
  const needsRefresh = !session.expiresAt || now >= session.expiresAt - REFRESH_BUFFER_SECONDS

  if (needsRefresh) {
    if (!(await tryRefresh(session))) {
      console.error("[proxy] destroying session - refresh failed", {
        path: req.nextUrl.pathname,
        hadRefreshToken: !!session.refreshToken,
        expiresAt: session.expiresAt,
        now,
      })
      await session.destroy()
      return unauthorized(req, res)
    }
    return forwardRefreshedCookie(req, res)
  }

  return res
}

export const config = {
  matcher: ["/account/:path*", "/api/account/:path*"],
}
