import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sis.omega.com.do",
        pathname: "/ProductImages/**",
      },
      {
        protocol: "https",
        hostname: "www.latechrd.com",
        pathname: "/cdn/shop/files/**",
      },
      {
        protocol: "https",
        hostname: "www.bios.do",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "overclockedrd.com",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
};

export default nextConfig;