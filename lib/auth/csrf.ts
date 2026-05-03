import "server-only"
import { config } from "@/lib/env"

// State-changing endpoints (POST/DELETE) reject anything that isn't a same-origin
// request from the same authenticated browser. This blocks classic form-CSRF —
// the iron-session cookie is sameSite=lax so a top-level form POST from a third
// party would otherwise carry it.
//
// Modern browsers send Sec-Fetch-Site on every fetch/navigate. We trust it when
// present and fall back to comparing Origin against config.appUrl for older
// clients. Missing both → deny.
export function isSameOrigin(req: Request): boolean {
  const sfs = req.headers.get("sec-fetch-site")
  if (sfs === "same-origin") return true
  if (sfs) return false

  const origin = req.headers.get("origin")
  if (!origin) return false
  try {
    return new URL(origin).origin === new URL(config.appUrl).origin
  } catch {
    return false
  }
}
