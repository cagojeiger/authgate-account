import { NextResponse } from "next/server"
import { authgateClient } from "@/lib/api/authgate-client"
import { isSameOrigin } from "@/lib/auth/csrf"
import { requireUser } from "@/lib/auth/require-user"

const CLIENT_ID_PATTERN = /^[A-Za-z0-9._-]{1,64}$/

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ client_id: string }> },
) {
  if (!isSameOrigin(req)) return new NextResponse(null, { status: 403 })

  const { client_id } = await params
  if (!CLIENT_ID_PATTERN.test(client_id)) {
    return new NextResponse(null, { status: 400 })
  }

  const session = await requireUser()
  if (!session) return new NextResponse(null, { status: 401 })

  const res = await authgateClient.revokeConnection(session, client_id)
  return new NextResponse(null, { status: res.ok ? 204 : res.status })
}
