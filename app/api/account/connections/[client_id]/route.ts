import { NextRequest, NextResponse } from "next/server"
import { authgateFetch } from "@/lib/authgate"
import { getSession } from "@/lib/session"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ client_id: string }> },
) {
  const { client_id } = await params
  const session = await getSession()
  if (!session.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const res = await authgateFetch(`/console/me/connections/${client_id}`, session, {
    method: "DELETE",
  })
  return new NextResponse(null, { status: res.ok ? 204 : res.status })
}
