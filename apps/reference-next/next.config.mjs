import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@gds/theme', '@gds/core', '@gds/admin'],
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      '@gds/theme/server': resolve(__dirname, '../../packages/gds-theme/src/server.ts'),
      '@gds/theme/client': resolve(__dirname, '../../packages/gds-theme/src/client.ts'),
      '@gds/core/server': resolve(__dirname, '../../packages/gds-core/src/server.ts'),
      '@gds/core/client': resolve(__dirname, '../../packages/gds-core/src/client.ts'),
      '@gds/admin/server': resolve(__dirname, '../../packages/gds-admin/src/server.ts'),
      '@gds/admin/client': resolve(__dirname, '../../packages/gds-admin/src/client.ts'),
    };
    return config;
  },
};

export default nextConfig;
