import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import * as client from "openid-client"
import { config as env } from "@/lib/env"
import { getOidcConfig } from "@/lib/auth/openid"

export async function GET() {
  const oidc = await getOidcConfig()
  const codeVerifier = client.randomPKCECodeVerifier()
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier)
  const state = client.randomState()

  // PKCE cookies only need to be readable by the callback; scope them there
  // and shorten the TTL — 120s is plenty for the IdP round-trip.
  const jar = await cookies()
  const pkceCookie = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 120,
    path: "/api/auth/callback",
  }
  jar.set("pkce_verifier", codeVerifier, pkceCookie)
  jar.set("pkce_state", state, pkceCookie)

  const url = client.buildAuthorizationUrl(oidc, {
    redirect_uri: env.authgate.redirectUri,
    scope: "openid profile email offline_access",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
  })

  return NextResponse.redirect(url.href)
}
