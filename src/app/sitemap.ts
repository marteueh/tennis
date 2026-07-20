import type { MetadataRoute } from 'next'
import { getMatches, getPlayers, getTournaments } from '@/lib/supabase'

const BASE_URL = process.env.AUTH_URL ?? 'https://acechronicle.it'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [
    { url: BASE_URL,                          lastModified: new Date(), changeFrequency: 'weekly',  priority: 1 },
    { url: `${BASE_URL}/partite`,             lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE_URL}/giocatori`,           lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/tornei`,              lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/la-voce-narrante`,    lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE_URL}/newsletter`,          lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
  ]

  // Partite
  try {
    const { data: matches } = await getMatches({ limit: 1000 })
    for (const m of matches) {
      routes.push({
        url: `${BASE_URL}/partite/${m.slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: m.featured ? 0.9 : 0.7,
      })
    }
  } catch { /* skip if Supabase not configured */ }

  // Giocatori
  try {
    const players = await getPlayers()
    for (const p of players) {
      routes.push({
        url: `${BASE_URL}/giocatori/${p.slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    }
  } catch { /* skip */ }

  // Tornei + anni
  try {
    const tournaments = await getTournaments()
    const YEARS = Array.from({ length: 16 }, (_, i) => 1985 + i)
    for (const t of tournaments) {
      routes.push({
        url: `${BASE_URL}/tornei/${t.slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
      })
      for (const y of YEARS) {
        routes.push({
          url: `${BASE_URL}/tornei/${t.slug}/${y}`,
          lastModified: new Date(),
          changeFrequency: 'yearly',
          priority: 0.6,
        })
      }
    }
  } catch { /* skip */ }

  return routes
}
