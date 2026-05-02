import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { config } from "@/lib/env"
import { generateCodeVerifier, generateCodeChallenge, generateState } from "@/lib/auth/pkce"

export async function GET() {
  const codeVerifier = await generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)
  const state = generateState()

  // PKCE cookies only need to be readable by the callback, so scope them there
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

  const params = new URLSearchParams({
    client_id: config.authgate.clientId,
    response_type: "code",
    redirect_uri: config.authgate.redirectUri,
    scope: "openid profile email offline_access",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
  })

  return NextResponse.redirect(`${config.authgate.issuer}/authorize?${params}`)
}
