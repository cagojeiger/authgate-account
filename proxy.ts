import { NextRequest, NextResponse } from "next/server"
import { getIronSession } from "iron-session"
import { SessionData } from "@/lib/auth/session"

const sessionOptions = {
  cookieName: "aa_session",
  password: process.env.SESSION_SECRET!,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  },
}

export async function proxy(req: NextRequest) {
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
