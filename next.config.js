/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export', // Required for GitHub Pages
    basePath: process.env.NODE_ENV === 'production' ? '/gdrive-scroller' : '',
    assetPrefix: process.env.NODE_ENV === 'production' ? '/gdrive-scroller/' : '',
    trailingSlash: true, // Recommended for GitHub Pages
    images: {
        unoptimized: true, // Required for static export
    },
}

module.exports = nextConfig