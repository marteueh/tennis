'use server'

import { revalidatePath } from 'next/cache'
import { updatePlayerEditorial } from '@/lib/supabase'

function strOrNull(v: FormDataEntryValue | null): string | null {
  const s = (v as string ?? '').trim()
  return s.length === 0 ? null : s
}

export async function savePlayerEditorial(formData: FormData) {
  const id   = parseInt(formData.get('id') as string, 10)
  const slug = formData.get('slug') as string
  await updatePlayerEditorial({
    id,
    photo_url:    strOrNull(formData.get('photo_url')),
    photo_credit: strOrNull(formData.get('photo_credit')),
    bio_it:       strOrNull(formData.get('bio_it')),
    bio_en:       strOrNull(formData.get('bio_en')),
    bio_source:   strOrNull(formData.get('bio_source')),
    clerici_url:  strOrNull(formData.get('clerici_url')),
  })
  revalidatePath(`/admin/players/${slug}`)
  revalidatePath(`/giocatori/${slug}`)
}
