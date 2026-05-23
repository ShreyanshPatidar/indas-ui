import type { NextConfig } from 'next'

const isProd = process.env.NODE_ENV === 'production'
const repoName = 'indas-ui'

const config: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  basePath: isProd ? `/${repoName}` : '',
  assetPrefix: isProd ? `/${repoName}/` : '',
  trailingSlash: true,
  transpilePackages: ['indas-ui'],
}

export default config
