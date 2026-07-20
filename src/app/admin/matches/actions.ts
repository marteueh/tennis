'use server'

import { revalidatePath } from 'next/cache'
import { updateMatchEditorial } from '@/lib/supabase'

function strOrNull(v: FormDataEntryValue | null): string | null {
  const s = (v as string ?? '').trim()
  return s.length === 0 ? null : s
}

function extractVideoId(input: string | null): string | null {
  if (!input) return null
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

export async function saveMatchEditorial(formData: FormData) {
  const id   = parseInt(formData.get('id') as string, 10)
  const slug = formData.get('slug') as string
  const videoInput = strOrNull(formData.get('youtube_url'))
  await updateMatchEditorial({
    id,
    youtube_video_id: extractVideoId(videoInput),
    youtube_channel:  strOrNull(formData.get('youtube_channel')),
    editorial_note_it: strOrNull(formData.get('editorial_note_it')),
    featured: formData.get('featured') === 'on',
  })
  revalidatePath(`/admin/matches/${slug}`)
  revalidatePath(`/partite/${slug}`)
}
