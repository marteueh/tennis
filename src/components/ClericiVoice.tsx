'use client'

import { trackClericiClick } from '@/lib/analytics'

interface ClericiVoiceProps {
  excerpt: string | null
  articleUrl: string | null
  articleTitle?: string | null
  source?: string | null
  matchSlug?: string
  matchTitle?: string
}

export function ClericiVoice({
  excerpt,
  articleUrl,
  articleTitle,
  source,
  matchSlug = '',
  matchTitle = '',
}: ClericiVoiceProps) {
  if (!excerpt && !articleUrl) return null

  if (!excerpt) {
    return (
      <div
        style={{
          padding: '16px 20px',
          background: 'rgba(181,74,44,0.04)',
          border: '1px solid rgba(181,74,44,0.12)',
          borderLeft: '3px solid rgba(181,74,44,0.3)',
          borderRadius: '0 2px 2px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: '#7C7568', margin: 0 }}>
            Cronaca di <strong style={{ color: '#1C1A17', fontWeight: 600 }}>Gianni Clerici</strong> su La Repubblica
          </p>
          {articleTitle && (
            <p style={{
              fontFamily: "'Source Serif 4', serif", fontStyle: 'italic',
              fontSize: 13, color: '#1C1A17', marginTop: 4, lineHeight: 1.4,
            }}>
              «{articleTitle}»
            </p>
          )}
        </div>
        <a
          href={articleUrl ?? '#'}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackClericiClick(matchSlug, matchTitle)}
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: '#B54A2C',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Apri su Repubblica →
        </a>
      </div>
    )
  }

  return (
    <div
      style={{
        background: 'rgba(181,74,44,0.05)',
        border: '1px solid rgba(181,74,44,0.15)',
        borderLeft: '3px solid #B54A2C',
        padding: '24px 24px 20px',
        borderRadius: '0 2px 2px 0',
      }}
    >
      {/* Header autore */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div
          style={{
            width: 36,
            height: 36,
            background: '#1C1A17',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Source Serif 4', serif",
            fontStyle: 'italic',
            fontSize: 14,
            color: '#B54A2C',
            letterSpacing: '0.02em',
            flexShrink: 0,
          }}
        >
          GC
        </div>
        <div>
          <p
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              color: '#1C1A17',
              marginBottom: 2,
            }}
          >
            Gianni Clerici
          </p>
          <p
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 11,
              color: '#7C7568',
              letterSpacing: '0.03em',
            }}
          >
            {source ?? 'La Repubblica'}
          </p>
        </div>
      </div>

      {/* Estratto — massimo una frase */}
      <blockquote
        style={{
          fontFamily: "'Source Serif 4', serif",
          fontStyle: 'italic',
          fontSize: 14,
          lineHeight: 1.75,
          color: '#1C1A17',
          margin: '0 0 16px',
          paddingLeft: 0,
          border: 0,
        }}
      >
        &ldquo;{excerpt}&rdquo;
      </blockquote>

      {/* Link articolo */}
      {articleUrl && (
        <a
          href={articleUrl ?? '#'}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 12,
            fontWeight: 500,
            color: '#B54A2C',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
          onClick={() => trackClericiClick(matchSlug, matchTitle)}
        >
          Leggi l&#39;articolo completo su La Repubblica
          <span aria-hidden="true">→</span>
        </a>
      )}

      <p
        style={{
          marginTop: 12,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 10,
          letterSpacing: '0.06em',
          color: 'rgba(28,26,23,0.35)',
          lineHeight: 1.6,
        }}
      >
        © La Repubblica / GEDI — riproduzione parziale per fini culturali ex art. 70 L. 633/1941
      </p>
    </div>
  )
}
