/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Rewrites barrel imports to their modules; the setup that consumers reported failing.
    optimizePackageImports: ['@mantine/core', '@sovereignsquad/gds', '@sovereignsquad/gds-core'],
  },
};
export default nextConfig;
