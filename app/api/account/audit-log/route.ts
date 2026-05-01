import { NextRequest, NextResponse } from "next/server"
import { authgateFetch } from "@/lib/authgate"
import { getSession } from "@/lib/session"

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = req.nextUrl
  const page = searchParams.get("page") ?? "1"
  const limit = searchParams.get("limit") ?? "20"

  const res = await authgateFetch(`/console/me/audit-log?page=${page}&limit=${limit}`, session)
  if (res.status === 401) return NextResponse.json({ error: "session_expired" }, { status: 401 })
  if (!res.ok) return NextResponse.json({ events: [], page: 1, limit: 20, total: 0 })
  return NextResponse.json(await res.json())
}
