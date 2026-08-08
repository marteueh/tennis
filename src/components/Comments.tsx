'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { postComment } from '@/app/partite/[slug]/comments-actions'
import type { Comment } from '@/lib/types'

interface Props {
  matchSlug: string
  matchTitle: string
  initialComments: Comment[]
  hasPendingFromUser: boolean
}

export function Comments({ matchSlug, initialComments, hasPendingFromUser }: Props) {
  const session = useSession()
  const [comments] = useState(initialComments)
  const [pending, setPending] = useState(hasPendingFromUser)
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const charsLeft = 2000 - body.length

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setSuccess(null)
    const fd = new FormData()
    fd.append('body', body)
    startTransition(async () => {
      const result = await postComment(matchSlug, fd)
      if (result.success) {
        setBody('')
        if (result.status === 'pending') {
          setPending(true)
          setSuccess('Commento inviato. Sarà visibile dopo l\'approvazione di un moderatore.')
        } else {
          setSuccess('Commento pubblicato.')
        }
      } else {
        setError(result.error ?? 'Errore inatteso.')
      }
    })
  }

  return (
    <div>
      {/* Lista commenti approvati */}
      {comments.length === 0 ? (
        <p style={{ fontSize: 13, color: 'rgba(var(--ink-rgb),0.4)', fontStyle: 'italic', marginBottom: 24 }}>
          Nessun commento ancora. Sii il primo a commentare questa partita.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
          {comments.map(c => <CommentItem key={c.id} comment={c} />)}
        </div>
      )}

      {/* Form commento */}
      {session.status === 'loading' ? (
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>...</div>
      ) : session.status !== 'authenticated' ? (
        <div style={{
          padding: '14px 18px',
          background: 'rgba(var(--accent-rgb),0.04)',
          border: '1px solid rgba(var(--accent-rgb),0.15)',
          borderLeft: '3px solid var(--accent)',
          borderRadius: '0 2px 2px 0',
        }}>
          <p style={{ fontSize: 13, color: 'var(--ink)', marginBottom: 8 }}>
            Vuoi commentare questa partita?
          </p>
          <Link
            href={`/auth/signin?callbackUrl=/partite/${matchSlug}`}
            style={{
              fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 600,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: 'var(--accent)', textDecoration: 'none',
            }}
          >
            Accedi con un click →
          </Link>
        </div>
      ) : (
        <form onSubmit={submit}>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Condividi un ricordo, un'osservazione, una correzione..."
            rows={4}
            maxLength={2000}
            disabled={isPending}
            style={{
              width: '100%', fontSize: 14, lineHeight: 1.6, padding: '10px 12px',
              border: '1px solid rgba(var(--ink-rgb),0.15)', borderRadius: 2,
              boxSizing: 'border-box', color: 'var(--ink)',
              fontFamily: "var(--font-sans)",
              resize: 'vertical',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <span style={{ fontSize: 11, color: charsLeft < 100 ? 'var(--gold)' : 'var(--muted)' }}>
              {charsLeft} caratteri
            </span>
            <button
              type="submit"
              disabled={isPending || body.trim().length < 3}
              style={{
                fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 600,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                padding: '8px 18px',
                background: isPending ? '#9CA3AF' : 'var(--accent)',
                color: '#FFFFFF',
                border: 'none', borderRadius: 2,
                cursor: isPending || body.trim().length < 3 ? 'not-allowed' : 'pointer',
                opacity: body.trim().length < 3 ? 0.5 : 1,
              }}
            >
              {isPending ? 'Invio...' : 'Pubblica commento'}
            </button>
          </div>

          {error && (
            <p style={{ marginTop: 10, fontSize: 12, color: '#991B1B', padding: '8px 12px', background: 'rgba(220,38,38,0.05)', borderRadius: 2 }}>
              {error}
            </p>
          )}
          {success && (
            <p style={{ marginTop: 10, fontSize: 12, color: '#16A34A', padding: '8px 12px', background: 'rgba(34,197,94,0.06)', borderRadius: 2 }}>
              {success}
            </p>
          )}
          {pending && !success && (
            <p style={{ marginTop: 10, fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>
              Hai un commento in attesa di moderazione per questa partita.
            </p>
          )}
        </form>
      )}
    </div>
  )
}

function CommentItem({ comment }: { comment: Comment }) {
  const date = new Date(comment.created_at)
  const dateLabel = date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
  const initials = (comment.user_name ?? '??').split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2)

  return (
    <article
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(var(--ink-rgb),0.07)',
        borderRadius: 2,
        padding: '14px 16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{
          width: 28, height: 28,
          background: 'rgba(var(--accent-rgb),0.08)',
          color: 'var(--accent)',
          borderRadius: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
        }}>
          {initials || '?'}
        </div>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
          {comment.user_name ?? 'Utente'}
        </span>
        {comment.user_role === 'admin' && (
          <span style={{
            fontSize: 9, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '1px 6px', borderRadius: 2,
            background: 'rgba(var(--gold-rgb),0.15)', color: '#92400E',
          }}>
            Redazione
          </span>
        )}
        <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 'auto' }}>
          {dateLabel}
        </span>
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--ink)', whiteSpace: 'pre-wrap' }}>
        {comment.body}
      </p>
    </article>
  )
}
