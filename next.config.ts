import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // Enable static exports
  basePath: 'gdrive-scroller',
  images: {
    unoptimized: true, // Disable image optimization for static export
  },
  // Optional: Add basePath if deploying to a subdirectory
  // basePath: '/my-github-pages-app',
};

module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'drive.usercontent.google.com',
        // Optionally restrict paths and ports
        // pathname: '/download/**',
        // port: '',
      },
      // Add more patterns as needed
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 3600,
  },
}

export default nextConfig;