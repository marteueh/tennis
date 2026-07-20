'use server'

import { revalidatePath } from 'next/cache'
import {
  createCulturalImpact,
  updateCulturalImpact,
  deleteCulturalImpact,
} from '@/lib/supabase'

function strOrNull(v: FormDataEntryValue | null): string | null {
  const s = (v as string ?? '').trim()
  return s.length === 0 ? null : s
}

function intOrNull(v: FormDataEntryValue | null): number | null {
  const s = strOrNull(v)
  if (!s) return null
  const n = parseInt(s, 10)
  return isNaN(n) ? null : n
}

function revalidateContext(kind: string, id: number) {
  // Revalidate sia la pagina admin sia la pagina pubblica relativa
  if (kind === 'player') {
    revalidatePath(`/admin/players/${id}`)
    revalidatePath('/giocatori', 'layout')
  } else if (kind === 'match') {
    revalidatePath(`/admin/matches/${id}`)
    revalidatePath('/partite', 'layout')
  } else if (kind === 'tournament') {
    revalidatePath(`/admin/tournaments/${id}`)
    revalidatePath('/tornei', 'layout')
  }
}

export async function saveCulturalImpact(formData: FormData) {
  const idRaw = strOrNull(formData.get('id'))
  const id    = idRaw ? parseInt(idRaw, 10) : null

  const contextKind = formData.get('context_kind') as string
  const contextId   = parseInt(formData.get('context_id') as string, 10)

  const params = {
    type:       (formData.get('type') as string) || 'book',
    emoji:      strOrNull(formData.get('emoji')),
    title:      (formData.get('title') as string).trim(),
    year:       intOrNull(formData.get('year')),
    author:     strOrNull(formData.get('author')),
    body:       (formData.get('body') as string).trim(),
    url:        strOrNull(formData.get('url')),
    link_level: (formData.get('link_level') as string) || 'direct',
    match_ids:      contextKind === 'match'  ? [contextId] : [],
    player_ids:     contextKind === 'player' ? [contextId] : [],
    tournament_id:  contextKind === 'tournament' ? contextId : null,
  }

  if (id) {
    await updateCulturalImpact({ id, ...params })
  } else {
    await createCulturalImpact(params)
  }
  revalidateContext(contextKind, contextId)
}

export async function deleteCulturalImpactAction(formData: FormData) {
  const id = parseInt(formData.get('id') as string, 10)
  const contextKind = formData.get('context_kind') as string
  const contextId   = parseInt(formData.get('context_id') as string, 10)
  await deleteCulturalImpact(id)
  revalidateContext(contextKind, contextId)
}

// ── Quick-add spot pubblicitario YouTube ──────────────────────────────

function extractYouTubeId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  try {
    const url = new URL(trimmed)
    if (url.hostname.includes('youtube.com')) return url.searchParams.get('v')
    if (url.hostname === 'youtu.be') return url.pathname.slice(1).split('?')[0] || null
  } catch { /* not a URL */ }
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed
  return null
}

interface OEmbedResponse {
  title?: string
  author_name?: string
  thumbnail_url?: string
}

async function fetchYouTubeMetadata(videoId: string): Promise<OEmbedResponse> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (!res.ok) return {}
    return await res.json() as OEmbedResponse
  } catch {
    return {}
  }
}

// Estrae slogan dal titolo (testo in virgolette o dopo trattino)
function extractSlogan(title: string): string | null {
  const m =
    title.match(/["“„«]([^"”»]{3,70})["”»]/) ||
    title.match(/'([^']{3,70})'/) ||
    title.match(/-\s+([A-Z][^-\d()]{3,60})(?:\s*\(|$)/)
  if (!m) return null
  const slogan = m[1].replace(/\s+/g, ' ').trim()
  if (/^(commercial|spot|ad|tv\s*ad|tennis|vintage)$/i.test(slogan)) return null
  return slogan
}

// Costruisce descrizione narrativa da titolo + brand + anno
function buildAdDescription({ title, brand, year }: { title: string; brand: string | null; year: number | null }): string {
  const slogan = extractSlogan(title)
  const parts: string[] = []

  if (brand && year)      parts.push(`Spot ${brand}, ${year}`)
  else if (brand)         parts.push(`Spot ${brand}`)
  else if (year)          parts.push(`Spot pubblicitario del ${year}`)
  else                    parts.push('Spot pubblicitario')

  if (slogan) parts.push(`campagna «${slogan}»`)

  const directedBy = title.match(/directed\s+by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)?.[1]
  if (directedBy) parts.push(`regia di ${directedBy}`)

  return parts.join(' — ') + '.'
}

export async function addCommercialFromUrl(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const contextKind = formData.get('context_kind') as string
  const contextId   = parseInt(formData.get('context_id') as string, 10)

  if (contextKind !== 'player') {
    return { ok: false, error: 'Solo per contesto giocatore' }
  }

  const rawUrl = (formData.get('youtube_url') as string ?? '').trim()
  const videoId = extractYouTubeId(rawUrl)
  if (!videoId) return { ok: false, error: 'URL YouTube non valido' }

  const fullUrl = `https://www.youtube.com/watch?v=${videoId}`

  // Auto-fill via oEmbed (no API key necessario)
  const meta = await fetchYouTubeMetadata(videoId)

  // Override manuali (se compilati dall'utente)
  const manualTitle  = strOrNull(formData.get('title'))
  const manualBrand  = strOrNull(formData.get('brand'))
  const manualYear   = intOrNull(formData.get('year'))
  const manualBody   = strOrNull(formData.get('body'))

  const title = manualTitle ?? meta.title ?? `Spot YouTube ${videoId}`
  const author = manualBrand ?? meta.author_name ?? null
  const body = manualBody ?? buildAdDescription({ title, brand: manualBrand ?? null, year: manualYear })

  await createCulturalImpact({
    type:          'ad',
    emoji:         '📺',
    title:         title.slice(0, 200),
    year:          manualYear,
    author:        author?.slice(0, 200) ?? null,
    body,
    url:           fullUrl,
    match_ids:     [],
    player_ids:    [contextId],
    tournament_id: null,
    link_level:    'direct',
  })

  revalidateContext(contextKind, contextId)
  return { ok: true }
}
