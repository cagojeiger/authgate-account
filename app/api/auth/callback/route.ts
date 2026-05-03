import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import * as client from "openid-client"
import { config as env } from "@/lib/env"
import { getSession } from "@/lib/auth/session"
import { getOidcConfig } from "@/lib/auth/openid"

export async function GET(req: NextRequest) {
  const error = req.nextUrl.searchParams.get("error")
  if (error) {
    return NextResponse.redirect(new URL(`/?error=${error}`, env.appUrl))
  }

  const jar = await cookies()
  const expectedState = jar.get("pkce_state")?.value
  const pkceCodeVerifier = jar.get("pkce_verifier")?.value
  jar.delete("pkce_state")
  jar.delete("pkce_verifier")

  if (!expectedState || !pkceCodeVerifier) {
    return NextResponse.redirect(new URL("/?error=state_mismatch", env.appUrl))
  }

  // Behind a TLS-terminating proxy (istio/Cloudflare) `req.url` is the
  // pod-internal URL (http://localhost:3000/...), which doesn't match the
  // `redirect_uri` registered with authgate. Rebuild the callback URL from
  // env.authgate.redirectUri (the registered, public form) and only carry
  // over the query params that authgate appended.
  const callbackUrl = new URL(env.authgate.redirectUri)
  for (const [k, v] of req.nextUrl.searchParams) callbackUrl.searchParams.set(k, v)

  const oidc = await getOidcConfig()
  let tokens
  try {
    tokens = await client.authorizationCodeGrant(oidc, callbackUrl, {
      pkceCodeVerifier,
      expectedState,
      idTokenExpected: true,
    })
  } catch (err) {
    console.error("[auth/callback] token exchange failed:", err)
    return NextResponse.redirect(new URL("/?error=token_exchange_failed", env.appUrl))
  }

  const claims = tokens.claims()
  if (!claims) {
    return NextResponse.redirect(new URL("/?error=invalid_token", env.appUrl))
  }

  // authgate sets IDTokenUserinfoClaimsAssertion=false, so email/name are
  // not in the id_token; fetch them from /userinfo using the access_token.
  let email = (claims.email as string | undefined) ?? ""
  let name = (claims.name as string | undefined) ?? ""
  try {
    const userinfo = await client.fetchUserInfo(oidc, tokens.access_token, claims.sub)
    email = userinfo.email ?? email
    name = userinfo.name ?? name
  } catch {
    // best-effort
  }

  const session = await getSession()
  session.sub = claims.sub
  session.email = email
  session.name = name || email
  session.accessToken = tokens.access_token
  session.refreshToken = tokens.refresh_token ?? ""
  session.expiresAt = Math.floor(Date.now() / 1000) + (tokens.expires_in ?? 900)
  await session.save()

  return NextResponse.redirect(new URL("/account", env.appUrl))
}
