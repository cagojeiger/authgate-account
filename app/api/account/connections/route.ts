import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { config } from "@/lib/config"

export async function GET() {
  const session = await getSession()
  if (!session.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const res = await fetch(`${config.authgate.issuer}/console/me/connections`, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
    cache: "no-store",
  })

  if (!res.ok) {
    return NextResponse.json({ connections: [] })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
