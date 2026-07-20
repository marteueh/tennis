'use server'

import { revalidatePath } from 'next/cache'
import { updateYoutubeData } from '@/lib/supabase'

function extractVideoId(input: string): string | null {
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

export async function saveYoutube(formData: FormData) {
  const id      = Number(formData.get('id'))
  const raw     = (formData.get('youtube_url') as string ?? '').trim()
  const channel = (formData.get('youtube_channel') as string ?? '').trim() || null
  const videoId = extractVideoId(raw)
  await updateYoutubeData({ id, youtube_video_id: videoId, youtube_channel: channel })
  revalidatePath('/admin/youtube')
}

export async function removeYoutube(formData: FormData) {
  const id = Number(formData.get('id'))
  await updateYoutubeData({ id, youtube_video_id: null, youtube_channel: null })
  revalidatePath('/admin/youtube')
}
