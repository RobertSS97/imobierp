import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "standalone", // Use apenas para Docker. Comentar para Vercel.
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
