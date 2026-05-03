import { NextResponse } from "next/server"
import { authgateClient } from "@/lib/api/authgate-client"
import { requireUser } from "@/lib/auth/require-user"

export async function GET() {
  const session = await requireUser()
  if (!session) return new NextResponse(null, { status: 401 })

  const res = await authgateClient.getAuditLog(session)
  if (!res.ok) return new NextResponse(null, { status: res.status })
  return NextResponse.json(await res.json())
}
