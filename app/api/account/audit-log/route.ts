import { NextResponse } from "next/server"
import { authgateClient } from "@/lib/api/authgate-client"
import { tryRefresh } from "@/lib/auth/refresh"
import { requireUser } from "@/lib/auth/require-user"

export async function GET() {
  const session = await requireUser()
  if (!session) return new NextResponse(null, { status: 401 })

  let res = await authgateClient.getAuditLog(session)
  if (res.status === 401 && (await tryRefresh(session))) {
    res = await authgateClient.getAuditLog(session)
  }
  if (res.status === 401) {
    await session.destroy()
    return new NextResponse(null, { status: 401 })
  }
  if (!res.ok) return new NextResponse(null, { status: res.status })
  return NextResponse.json(await res.json())
}
