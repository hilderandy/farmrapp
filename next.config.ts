import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    useOffline: true,
  },
  async headers() {
    return [
      {
        source: "/:path*{/}?",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Let nginx stream responses instead of buffering them.
          { key: "X-Accel-Buffering", value: "no" },
        ],
      },
    ];
  },
};

export default nextConfig;
