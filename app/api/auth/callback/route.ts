import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRemoteJWKSet, jwtVerify } from "jose"
import { config } from "@/lib/config"
import { getSession } from "@/lib/session"

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

  // Clean up PKCE cookies
  jar.delete("pkce_state")
  jar.delete("pkce_verifier")

  // Exchange code for tokens
  const tokenRes = await fetch(`${config.authgate.issuer}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: config.authgate.clientId,
      redirect_uri: config.authgate.redirectUri,
      code,
      code_verifier: codeVerifier,
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/?error=token_exchange_failed", req.url))
  }

  const tokens = await tokenRes.json()

  // Verify ID token
  const jwks = createRemoteJWKSet(new URL(`${config.authgate.issuer}/keys`))
  let claims: Record<string, unknown>
  try {
    const { payload } = await jwtVerify(tokens.id_token, jwks, {
      issuer: config.authgate.issuer,
      audience: config.authgate.clientId,
    })
    claims = payload as Record<string, unknown>
  } catch {
    return NextResponse.redirect(new URL("/?error=invalid_token", req.url))
  }

  // authgate sets IDTokenUserinfoClaimsAssertion=false, so email/name are
  // NOT in the id_token — fetch them from /userinfo using the access_token.
  let email = (claims.email as string | undefined) ?? ""
  let name = (claims.name as string | undefined) ?? ""

  try {
    const userinfoRes = await fetch(`${config.authgate.issuer}/userinfo`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      cache: "no-store",
    })
    if (userinfoRes.ok) {
      const ui = (await userinfoRes.json()) as { email?: string; name?: string }
      email = ui.email ?? email
      name = ui.name ?? name
    }
  } catch {
    // userinfo failure is non-fatal; session falls back to id_token claims
  }

  // Save session
  const session = await getSession()
  session.sub = claims.sub as string
  session.email = email
  session.name = name || email
  session.accessToken = tokens.access_token
  session.refreshToken = tokens.refresh_token
  session.idTokenClaims = claims
  await session.save()

  return NextResponse.redirect(new URL("/account", req.url))
}
