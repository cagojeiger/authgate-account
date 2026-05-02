function required(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing env var: ${key}`)
  return value
}

interface AuthgateConfig {
  issuer: string
  clientId: string
  redirectUri: string
}

interface SessionConfig {
  secret: string
}

let _authgate: AuthgateConfig | undefined
let _session: SessionConfig | undefined

export const config = {
  get authgate(): AuthgateConfig {
    return (_authgate ??= {
      issuer: required("AUTHGATE_ISSUER"),
      clientId: required("AUTHGATE_CLIENT_ID"),
      redirectUri: required("AUTHGATE_REDIRECT_URI"),
    })
  },
  get session(): SessionConfig {
    return (_session ??= {
      secret: required("SESSION_SECRET"),
    })
  },
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
}
