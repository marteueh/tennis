'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import crypto from 'crypto'
import DOMPurify from 'isomorphic-dompurify'
import { auth } from '@/auth'
import {
  createComment,
  getRecentUserCommentTimestamp,
  getUserApprovedCommentsCount,
  getUserById,
  getMatchBySlug,
} from '@/lib/supabase'

const TRUSTED_THRESHOLD = 5      // commenti approvati per diventare trusted
const RATE_LIMIT_SECONDS = 60    // tempo minimo tra commenti dello stesso utente
const MAX_LENGTH = 2000          // caratteri massimi per commento
const MIN_LENGTH = 3

function sanitizeBody(raw: string): string {
  // Strip ogni HTML — i commenti sono testo plain.
  // DOMPurify rimuove tag/attributi pericolosi anche dal testo decodificato.
  const cleaned = DOMPurify.sanitize(raw, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim()
  return cleaned
}

async function getClientIpHash(): Promise<string | null> {
  try {
    const h = await headers()
    const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim()
            ?? h.get('x-real-ip')
            ?? null
    if (!ip) return null
    // Hash con un salt fisso per non memorizzare l'IP in chiaro
    const salt = process.env.AUTH_SECRET ?? 'ace-chronicle-comments'
    return crypto.createHash('sha256').update(`${ip}:${salt}`).digest('hex').slice(0, 32)
  } catch {
    return null
  }
}

export interface PostCommentResult {
  success: boolean
  status?: 'pending' | 'approved'
  error?: string
}

export async function postComment(matchSlug: string, formData: FormData): Promise<PostCommentResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Devi accedere per commentare.' }
  }
  const userId = parseInt(session.user.id, 10)
  if (isNaN(userId)) return { success: false, error: 'Sessione non valida.' }

  // Verifica utente non bannato
  const user = await getUserById(userId)
  if (!user) return { success: false, error: 'Utente non trovato.' }
  if (user.role === 'banned') return { success: false, error: 'Il tuo account non può commentare.' }

  // Sanitizza testo
  const rawBody = (formData.get('body') as string ?? '')
  const body = sanitizeBody(rawBody)
  if (body.length < MIN_LENGTH) return { success: false, error: `Il commento è troppo corto (min ${MIN_LENGTH} caratteri).` }
  if (body.length > MAX_LENGTH) return { success: false, error: `Il commento è troppo lungo (max ${MAX_LENGTH} caratteri).` }

  // Rate limit: 1 commento ogni 60s per utente
  const last = await getRecentUserCommentTimestamp(userId)
  if (last) {
    const diffMs = Date.now() - new Date(last).getTime()
    if (diffMs < RATE_LIMIT_SECONDS * 1000) {
      const wait = Math.ceil((RATE_LIMIT_SECONDS * 1000 - diffMs) / 1000)
      return { success: false, error: `Aspetta ${wait}s prima di commentare di nuovo.` }
    }
  }

  // Trova la partita
  const match = await getMatchBySlug(matchSlug)
  if (!match) return { success: false, error: 'Partita non trovata.' }

  // Decidi stato: trusted/admin → approvato direttamente; altrimenti pending
  const approvedCount = await getUserApprovedCommentsCount(userId)
  const autoApprove = user.role === 'admin' || user.role === 'trusted' || approvedCount >= TRUSTED_THRESHOLD
  const status: 'pending' | 'approved' = autoApprove ? 'approved' : 'pending'

  const ipHash = await getClientIpHash()

  await createComment({
    match_id: match.id,
    user_id: userId,
    body,
    status,
    ip_hash: ipHash,
  })

  revalidatePath(`/partite/${matchSlug}`)
  return { success: true, status }
}
