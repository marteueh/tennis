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

  if (!videoId && !tommasiVideoId) {
    return (
      <div
        style={{
          background: '#1A1A1A',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 2,
          padding: '40px 32px',
          textAlign: 'center',
        }}
      >
        <svg
          width="40" height="40" viewBox="0 0 40 40" fill="none"
          style={{ margin: '0 auto 16px', opacity: 0.25 }} aria-hidden="true"
        >
          <rect width="40" height="40" rx="4" fill="white" fillOpacity="0.1" />
          <path d="M16 14l12 6-12 6V14z" fill="white" fillOpacity="0.4" />
        </svg>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>
          Video non disponibile per questa partita
        </p>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.25)', lineHeight: 1.6 }}>
          I canali ufficiali degli Slam rilasciano progressivamente i propri archivi su YouTube.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Toggle versioni — solo se entrambe disponibili */}
      {videoId && tommasiVideoId && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          <button
            onClick={() => setVersion('main')}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '6px 14px',
              background: version === 'main' ? '#1A1A1A' : 'transparent',
              color: version === 'main' ? '#FFFFFF' : '#7A7870',
              border: '1px solid',
              borderColor: version === 'main' ? '#1A1A1A' : 'rgba(26,26,26,0.15)',
              borderRadius: 2, cursor: 'pointer',
            }}
          >
            Versione originale
          </button>
          <button
            onClick={() => setVersion('tommasi')}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '6px 14px',
              background: version === 'tommasi' ? '#534AB7' : 'transparent',
              color: version === 'tommasi' ? '#FFFFFF' : '#534AB7',
              border: '1px solid #534AB7',
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
        marginTop: 8, fontFamily: "'DM Sans', sans-serif",
        fontSize: 11, color: 'rgba(26,26,26,0.35)', letterSpacing: '0.04em',
      }}>
        {version === 'tommasi' && tommasiVideoId
          ? <>Telecronaca di Rino Tommasi e Gianni Clerici · canale {tommasiChannel ?? 'YouTube'} · embed in Privacy Enhanced Mode</>
          : <>Video: canale YouTube ufficiale · embedato tramite YouTube IFrame API (Privacy Enhanced Mode)</>}
      </p>
    </div>
  )
}
