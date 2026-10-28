import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Next's filesystem/cache discovery inside this checkout in linked worktrees.
  turbopack: { root: process.cwd() },
};

export default nextConfig;
