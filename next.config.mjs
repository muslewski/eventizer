import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },

  // Only use webpack config when not using Turbopack
  // Turbopack doesn't need extensionAlias
  ...(process.env.TURBOPACK
    ? {}
    : {
        webpack: (webpackConfig) => {
          webpackConfig.resolve.extensionAlias = {
            '.cjs': ['.cts', '.cjs'],
            '.js': ['.ts', '.tsx', '.js', '.jsx'],
            '.mjs': ['.mts', '.mjs'],
          }
          return webpackConfig
        },
      }),
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
