import { getIronSession, IronSession } from "iron-session"
import { cookies } from "next/headers"
import { config } from "@/lib/env"

export interface SessionData {
  sub: string
  email: string
  name: string
  accessToken: string
  refreshToken: string
}

function sessionOptions() {
  return {
    cookieName: "aa_session",
    password: config.session.secret,
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax" as const,
    },
  }
}

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions())
}
