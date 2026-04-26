import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { config } from "@/lib/config"

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = req.nextUrl
  const page = searchParams.get("page") ?? "1"
  const limit = searchParams.get("limit") ?? "20"

  const res = await fetch(
    `${config.authgate.issuer}/console/me/audit-log?page=${page}&limit=${limit}`,
    {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: "no-store",
    }
  )
  if (!res.ok) return NextResponse.json({ events: [], page: 1, limit: 20, total: 0 })
  return NextResponse.json(await res.json())
}
