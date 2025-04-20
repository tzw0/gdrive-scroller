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
  // For static export (if using GitHub Pages)
  output: 'export',

  images: {
    // Allow image optimization from these domains
    domains: [
      'drive.google.com',
      'lh3.googleusercontent.com', // Google Drive thumbnails
      '*.googleusercontent.com'   // Covers all Google user content
    ],

    // Required for static export (GitHub Pages)
    unoptimized: true,

    // Optional: Set custom loader if needed
    loader: 'default'
  },

  // Only needed if your repo isn't USERNAME.github.io
  basePath: process.env.NODE_ENV === 'production' ? '/gdrive-scroller' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/gdrive-scroller/' : '',
}

export default nextConfig;