/** @type {import('next').NextConfig} */
const nextConfig = {
  // The existing static client site lives in /public and is served unchanged.
  // Uploaded images are written to /public/uploads and served from /uploads/*.
  async redirects() {
    return [
      // Visiting "/" serves the existing homepage without altering its markup.
      { source: '/', destination: '/index.html', permanent: false },
    ];
  },
  async rewrites() {
    return [
      // Legacy/static upload URLs are served by the dynamic uploads route so
      // files added after build still resolve in production.
      { source: '/uploads/:path*', destination: '/api/uploads/:path*' },
    ];
  },
};

export default nextConfig;
