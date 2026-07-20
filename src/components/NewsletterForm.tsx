'use client'

import { useState } from 'react'
import { trackNewsletterSignup } from '@/lib/analytics'

interface NewsletterFormProps {
  source?: string
  compact?: boolean
}

export function NewsletterForm({ source = 'homepage', compact = false }: NewsletterFormProps) {
  const [email, setEmail]     = useState('')
  const [status, setStatus]   = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const pubId = process.env.NEXT_PUBLIC_BEEHIIV_PUBLICATION_ID ?? ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !pubId) return
    setStatus('loading')
    try {
      const res = await fetch(`https://api.beehiiv.com/v2/publications/${pubId}/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, utm_source: source }),
      })
      if (res.ok) {
        setStatus('success')
        trackNewsletterSignup(source)
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div
        style={{
          padding: compact ? '12px 16px' : '20px 24px',
          background: 'rgba(181,74,44,0.08)',
          border: '1px solid rgba(181,74,44,0.2)',
          borderRadius: 2,
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: "'Source Serif 4', serif",
            fontStyle: 'italic',
            fontSize: compact ? 14 : 16,
            color: '#B54A2C',
          }}
        >
          Iscrizione confermata. A presto.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="La tua email"
        required
        style={{
          flex: 1,
          minWidth: 200,
          padding: compact ? '8px 12px' : '10px 14px',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 13,
          color: '#1C1A17',
          background: '#FFFFFF',
          border: '1px solid rgba(28,26,23,0.15)',
          borderRadius: 2,
          outline: 'none',
        }}
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        style={{
          padding: compact ? '8px 16px' : '10px 20px',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          background: '#B54A2C',
          color: '#ffffff',
          border: 'none',
          borderRadius: 2,
          cursor: status === 'loading' ? 'wait' : 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {status === 'loading' ? 'Invio…' : 'Iscriviti'}
      </button>
      {status === 'error' && (
        <p
          style={{
            width: '100%',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 12,
            color: '#D84F2E',
            marginTop: 4,
          }}
        >
          Si è verificato un errore. Riprova più tardi.
        </p>
      )}
    </form>
  )
}
