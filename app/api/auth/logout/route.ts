import { NextResponse } from "next/server"
import { config } from "@/lib/env"
import { isSameOrigin } from "@/lib/auth/csrf"
import { getSession } from "@/lib/auth/session"

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return new NextResponse(null, { status: 403 })

  const session = await getSession()

  if (session.refreshToken) {
    await fetch(`${config.authgate.issuer}/oauth/revoke`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        token: session.refreshToken,
        client_id: config.authgate.clientId,
      }),
    }).catch(() => {
      // revoke는 best-effort — 실패해도 세션은 지운다
    })
  }

  await session.destroy()
  return NextResponse.redirect(new URL("/", config.appUrl))
}
