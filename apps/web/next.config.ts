import type { NextConfig } from "next";

/**
 * Browser gọi same-origin `/api/*` trên web (:3001).
 * Next rewrite sang Nest (:3000) — cookie session gắn origin web, tránh CORS đau.
 */
const apiInternalUrl = process.env.API_INTERNAL_URL ?? "http://localhost:3000";

const nextConfig: NextConfig = {
  transpilePackages: ["@tripmind/shared"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiInternalUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
