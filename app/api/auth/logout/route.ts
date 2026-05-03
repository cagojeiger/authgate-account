import { NextResponse } from "next/server"
import * as client from "openid-client"
import { config as env } from "@/lib/env"
import { isSameOrigin } from "@/lib/auth/csrf"
import { getSession } from "@/lib/auth/session"
import { getOidcConfig } from "@/lib/auth/openid"

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return new NextResponse(null, { status: 403 })

  const session = await getSession()

  if (session.refreshToken) {
    try {
      const oidc = await getOidcConfig()
      await client.tokenRevocation(oidc, session.refreshToken)
    } catch {
      // revoke is best-effort; destroy the session regardless
    }
  }

  await session.destroy()
  return NextResponse.redirect(new URL("/", env.appUrl))
}
