import { getSession } from "@/lib/auth/session"

export async function requireUser() {
  const session = await getSession()
  if (!session.sub) return null
  return session
}
