import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.zurimuch.com" }],
        destination: "https://zurimuch.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
