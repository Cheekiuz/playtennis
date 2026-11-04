import type { NextConfig } from "next";
import path from "node:path";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Admin and API responses must never be indexed, even if linked.
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/api/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
  // Local tooling sometimes opens http://127.0.0.1:3000 while `next dev`
  // binds as localhost. Allow both so client hydration and Saved work.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  turbopack: {
    // Pin root to this app — a lockfile in the home directory otherwise
    // makes Turbopack infer the wrong workspace root.
    root: path.resolve(process.cwd()),
  },
};

export default nextConfig;
