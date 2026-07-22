import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "yt3.ggpht.com" },
      { protocol: "https", hostname: "*.ytimg.com" },
    ],
  },
};

export default nextConfig;
