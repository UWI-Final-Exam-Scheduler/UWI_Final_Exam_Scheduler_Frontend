import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL_LOCAL}/api/:path*`, // Forward to backend
      },
    ];
  },
};

export default nextConfig;
