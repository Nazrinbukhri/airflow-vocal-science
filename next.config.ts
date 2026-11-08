import type { NextConfig } from 'next';

// Static export: the whole app is plain HTML/JS/CSS, so it can be hosted anywhere
// and cached completely by the service worker for offline use.
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
