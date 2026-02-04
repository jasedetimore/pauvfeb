import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Set the turbopack root directory
  turbopack: {
    root: path.resolve(__dirname),
  },

  // Image optimization domains (add Supabase storage domain when needed)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },

  // Environment variables exposed to the browser (NEXT_PUBLIC_ prefix)
  env: {
    NEXT_PUBLIC_APP_NAME: "Pauv",
  },
};

export default nextConfig;
