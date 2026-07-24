import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin root to this app — a lockfile in the home directory otherwise
    // makes Turbopack infer the wrong workspace root.
    root: path.resolve(process.cwd()),
  },
};

export default nextConfig;
