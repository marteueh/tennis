import type { MetadataRoute } from 'next'

const BASE_URL = process.env.AUTH_URL ?? 'https://acechronicle.it'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
