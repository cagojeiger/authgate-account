import { NextResponse } from "next/server"
import { authgateFetch } from "@/lib/authgate"
import { getSession } from "@/lib/session"

export async function GET() {
  const session = await getSession()
  if (!session.sub) return new NextResponse(null, { status: 401 })

  const res = await authgateFetch("/console/me/connections", session)
  if (!res.ok) return new NextResponse(null, { status: res.status })
  return NextResponse.json(await res.json())
}
