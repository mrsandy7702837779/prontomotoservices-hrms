import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "prontomotoservices.blob.core.windows.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "randomuser.me", // for demo avatars
        pathname: "/**",
      },
    ],
  },
  
};

export default nextConfig;
