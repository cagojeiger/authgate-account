import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { config } from "@/lib/config"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ client_id: string }> }
) {
  const { client_id } = await params
  const session = await getSession()
  if (!session.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const res = await fetch(
    `${config.authgate.issuer}/console/me/connections/${client_id}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.accessToken}` },
    }
  )
  return new NextResponse(null, { status: res.ok ? 204 : res.status })
}
