import { createRemoteJWKSet, jwtVerify } from "jose"
import { config } from "@/lib/env"

export interface TokenResponse {
  access_token: string
  refresh_token: string
  id_token: string
  [key: string]: unknown
}

const jwks = createRemoteJWKSet(new URL(`${config.authgate.issuer}/keys`))

export async function exchangeCode(code: string, verifier: string): Promise<TokenResponse | null> {
  try {
    const tokenRes = await fetch(`${config.authgate.issuer}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: config.authgate.clientId,
        redirect_uri: config.authgate.redirectUri,
        code,
        code_verifier: verifier,
      }),
    })

    if (!tokenRes.ok) return null
    return (await tokenRes.json()) as TokenResponse
  } catch {
    return null
  }
}

export async function verifyIdToken(idToken: string): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(idToken, jwks, {
      issuer: config.authgate.issuer,
      audience: config.authgate.clientId,
    })
    return payload as Record<string, unknown>
  } catch {
    return null
  }
}

export async function fetchUserinfo(accessToken: string): Promise<{ email?: string; name?: string }> {
  try {
    const userinfoRes = await fetch(`${config.authgate.issuer}/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    })
    if (!userinfoRes.ok) return {}
    return (await userinfoRes.json()) as { email?: string; name?: string }
  } catch {
    return {}
  }
}
