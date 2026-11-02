import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
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
