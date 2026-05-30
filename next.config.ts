import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from Firebase Storage and Google avatars
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  // Empty turbopack config to suppress the webpack/turbopack conflict error
  // opentype.js is loaded via dynamic import on the client only, so no polyfills needed
  turbopack: {},
};

export default nextConfig;
