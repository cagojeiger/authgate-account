import { NextRequest, NextResponse } from "next/server"
import { getIronSession } from "iron-session"
import { SessionData } from "@/lib/session"

const sessionOptions = {
  cookieName: "aa_session",
  password: process.env.SESSION_SECRET!,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  },
}

const protectedPaths = ["/account"]

export async function middleware(req: NextRequest) {
  const isProtected = protectedPaths.some((p) => req.nextUrl.pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  const res = NextResponse.next()
  const session = await getIronSession<SessionData>(req, res, sessionOptions)

  if (!session.sub) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return res
}

export const config = {
  matcher: ["/account/:path*"],
}
