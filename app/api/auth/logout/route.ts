import { NextResponse } from "next/server"
import { config } from "@/lib/config"
import { getSession } from "@/lib/session"

export async function POST() {
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
  return NextResponse.redirect(new URL("/", process.env.APP_URL ?? "http://localhost:3000"))
}
