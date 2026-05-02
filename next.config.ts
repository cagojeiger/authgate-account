import type { NextConfig } from "next";

// CSP only — HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy and
// Permissions-Policy are already injected upstream by Cloudflare + istio. CSP
// has to be set app-side because only the app knows what's allowed.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
].join("; ")

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "Content-Security-Policy", value: csp }],
      },
    ]
  },
};

export default nextConfig;
