import "server-only"
import * as client from "openid-client"
import { config as env } from "@/lib/env"

// Discovery is one network call to /.well-known/openid-configuration. Cache the
// resulting Configuration for the process lifetime. If the call fails, drop the
// cache so we can retry on the next request — otherwise a single cold-start
// outage would brick auth until process restart.
let _config: Promise<client.Configuration> | undefined

export function getOidcConfig(): Promise<client.Configuration> {
  if (_config) return _config
  const promise = client.discovery(
    new URL(env.authgate.issuer),
    env.authgate.clientId,
    { redirect_uris: [env.authgate.redirectUri] },
    client.None(),
  )
  _config = promise
  promise.catch(() => {
    if (_config === promise) _config = undefined
  })
  return promise
}
