import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Forza la radice del workspace a questa cartella, ignora eventuali
  // lockfile di parent (es. C:\Users\user\package-lock.json).
  outputFileTracingRoot: process.cwd(),
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'loc.gov' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
    ],
  },
}

export default nextConfig
