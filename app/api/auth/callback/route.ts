import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getSession } from "@/lib/auth/session"
import { exchangeCode, fetchUserinfo, verifyIdToken } from "@/lib/auth/oidc"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${error}`, req.url))
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/?error=missing_params", req.url))
  }

  const jar = await cookies()
  const storedState = jar.get("pkce_state")?.value
  const codeVerifier = jar.get("pkce_verifier")?.value

  if (!storedState || state !== storedState || !codeVerifier) {
    return NextResponse.redirect(new URL("/?error=state_mismatch", req.url))
  }

  jar.delete("pkce_state")
  jar.delete("pkce_verifier")

  const tokens = await exchangeCode(code, codeVerifier)
  if (!tokens) {
    return NextResponse.redirect(new URL("/?error=token_exchange_failed", req.url))
  }

  const claims = await verifyIdToken(tokens.id_token)
  if (!claims) {
    return NextResponse.redirect(new URL("/?error=invalid_token", req.url))
  }

  // authgate sets IDTokenUserinfoClaimsAssertion=false, so email/name are
  // not in the id_token; fetch them from /userinfo using the access_token.
  let email = (claims.email as string | undefined) ?? ""
  let name = (claims.name as string | undefined) ?? ""

  const userinfo = await fetchUserinfo(tokens.access_token)
  email = userinfo.email ?? email
  name = userinfo.name ?? name

  const session = await getSession()
  session.sub = claims.sub as string
  session.email = email
  session.name = name || email
  session.accessToken = tokens.access_token
  session.refreshToken = tokens.refresh_token
  await session.save()

  return NextResponse.redirect(new URL("/account", req.url))
}
