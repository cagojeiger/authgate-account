import { NextResponse } from "next/server"
import { authgateClient } from "@/lib/api/authgate-client"
import { requireUser } from "@/lib/auth/require-user"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ client_id: string }> },
) {
  const { client_id } = await params
  const session = await requireUser()
  if (!session) return new NextResponse(null, { status: 401 })

  const res = await authgateClient.revokeConnection(session, client_id)
  return new NextResponse(null, { status: res.ok ? 204 : res.status })
}
