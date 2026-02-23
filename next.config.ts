import type { NextConfig } from "next";
import path from "path";

const supabaseUrl = "https://bsrizjihqrywmukqsess.supabase.co";

const isDev = process.env.NODE_ENV === "development";

// In development, Next.js requires 'unsafe-eval' for fast refresh / hot reload.
// In production, only 'self' and trusted third-party script hosts are allowed.
const scriptSrc = isDev
  ? "'self' 'unsafe-eval' 'unsafe-inline' https://static.cloudflareinsights.com https://www.googletagmanager.com https://www.google-analytics.com"
  : "'self' https://static.cloudflareinsights.com https://www.googletagmanager.com https://www.google-analytics.com";

const cspHeader = `
    default-src 'self';
    script-src ${scriptSrc};
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: ${supabaseUrl};
    connect-src 'self' ${supabaseUrl} https://*.supabase.co wss://*.supabase.co https://static.cloudflareinsights.com https://cloudflareinsights.com https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com;
    font-src 'self';
    object-src 'none';
    frame-src 'self' https://iframe.mediadelivery.net;
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
`;

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: cspHeader.replace(/\n/g, ""),
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

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
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
