'use client'

import { useEffect, useState } from 'react'
import { trackVideoPlay } from '@/lib/analytics'

interface MatchVideoProps {
  videoId: string | null
  tommasiVideoId?: string | null
  tommasiChannel?: string | null
  title: string
  tournament?: string
  year?: number
}

export function MatchVideo({
  videoId, tommasiVideoId, tommasiChannel,
  title, tournament = '', year = 0,
}: MatchVideoProps) {
  // Se è disponibile la versione italiana, di default mostriamo quella (esperienza editoriale italiana)
  const hasTommasi = !!tommasiVideoId
  const [version, setVersion] = useState<'main' | 'tommasi'>(hasTommasi ? 'tommasi' : 'main')

  const activeVideoId = version === 'tommasi' && tommasiVideoId ? tommasiVideoId : videoId

  useEffect(() => {
    if (activeVideoId) {
      trackVideoPlay(activeVideoId, title, tournament, year)
    }
  }, [activeVideoId, title, tournament, year])

  return (
    <div>
      {/* Toggle versioni — solo se entrambe disponibili */}
      {videoId && tommasiVideoId && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          <button
            onClick={() => setVersion('main')}
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '6px 14px',
              background: version === 'main' ? 'var(--ink)' : 'transparent',
              color: version === 'main' ? '#FFFFFF' : 'var(--muted)',
              border: '1px solid',
              borderColor: version === 'main' ? 'var(--ink)' : 'rgba(var(--ink-rgb),0.15)',
              borderRadius: 2, cursor: 'pointer',
            }}
          >
            Versione originale
          </button>
          <button
            onClick={() => setVersion('tommasi')}
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '6px 14px',
              background: version === 'tommasi' ? 'var(--accent)' : 'transparent',
              color: version === 'tommasi' ? '#FFFFFF' : 'var(--accent)',
              border: '1px solid var(--accent)',
              borderRadius: 2, cursor: 'pointer',
            }}
          >
            Telecronaca Tommasi/Clerici
          </button>
        </div>
      )}

      <div className="video-wrapper" style={{ borderRadius: 2, overflow: 'hidden' }}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${activeVideoId}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          style={{ border: 0 }}
        />
      </div>
      <p style={{
        marginTop: 8, fontFamily: "var(--font-sans)",
        fontSize: 11, color: 'rgba(var(--ink-rgb),0.35)', letterSpacing: '0.04em',
      }}>
        {version === 'tommasi' && tommasiVideoId
          ? <>Telecronaca di Rino Tommasi e Gianni Clerici · canale {tommasiChannel ?? 'YouTube'} · embed in Privacy Enhanced Mode</>
          : <>Video: canale YouTube ufficiale · embedato tramite YouTube IFrame API (Privacy Enhanced Mode)</>}
      </p>
    </div>
  )
}
