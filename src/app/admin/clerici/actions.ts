'use server'

import { revalidatePath } from 'next/cache'
import { updateClericiData } from '@/lib/supabase'

export async function saveClerici(formData: FormData) {
  const id      = Number(formData.get('id'))
  const url     = (formData.get('clerici_article_url') as string).trim() || null
  const excerpt = (formData.get('clerici_excerpt_it')  as string).trim() || null
  const source  = (formData.get('clerici_source')      as string).trim() || null

  await updateClericiData({ id, clerici_article_url: url, clerici_excerpt_it: excerpt, clerici_source: source })
  revalidatePath('/admin/clerici')
}
