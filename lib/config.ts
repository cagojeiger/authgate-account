function required(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing env var: ${key}`)
  return value
}

export const config = {
  authgate: {
    issuer: required("AUTHGATE_ISSUER"),
    clientId: required("AUTHGATE_CLIENT_ID"),
    redirectUri: required("AUTHGATE_REDIRECT_URI"),
  },
  session: {
    secret: required("SESSION_SECRET"),
  },
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
}
