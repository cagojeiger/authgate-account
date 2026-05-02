import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { config } from "@/lib/env"
import { generateCodeVerifier, generateCodeChallenge, generateState } from "@/lib/auth/pkce"

export async function GET() {
  const codeVerifier = await generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)
  const state = generateState()

  const jar = await cookies()
  jar.set("pkce_verifier", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 300, // 5 minutes
    path: "/",
  })
  jar.set("pkce_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 300,
    path: "/",
  })

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
