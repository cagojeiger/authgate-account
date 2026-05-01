import { NextResponse } from "next/server"
import { authgateFetch } from "@/lib/authgate"
import { getSession } from "@/lib/session"

export async function GET() {
  const session = await getSession()
  if (!session.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const res = await authgateFetch("/console/me/connections", session)
  if (res.status === 401) return NextResponse.json({ error: "session_expired" }, { status: 401 })
  if (!res.ok) return NextResponse.json({ connections: [] })
  return NextResponse.json(await res.json())
}
