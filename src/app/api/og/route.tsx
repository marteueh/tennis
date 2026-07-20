import { ImageResponse } from '@vercel/og'
import type { NextRequest } from 'next/server'

export const runtime = 'edge'

const PAPER  = '#F3EEE3'
const INK    = '#1C1A17'
const ACCENT = '#B54A2C'
const GOLD   = '#9C7C3E'
const MUTED  = '#7C7568'

async function fetchFont(url: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url)
    return res.ok ? res.arrayBuffer() : null
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const type   = searchParams.get('type')   ?? 'default'
  const winner = searchParams.get('winner') ?? ''
  const loser  = searchParams.get('loser')  ?? ''
  const score  = searchParams.get('score')  ?? ''
  const tourn  = searchParams.get('tourn')  ?? ''
  const year   = searchParams.get('year')   ?? ''
  const round  = searchParams.get('round')  ?? ''
  const player = searchParams.get('player') ?? ''
  const sub    = searchParams.get('sub')    ?? ''

  const bebasData = await fetchFont(
    new URL('/fonts/BebasNeue-Regular.ttf', req.url).toString()
  )
  const fonts = bebasData
    ? [{ name: 'Bebas', data: bebasData, weight: 400 as const, style: 'normal' as const }]
    : []

  const bebasFamily = bebasData ? '"Bebas"' : 'sans-serif'

  let content: React.ReactNode

  if (type === 'match' && winner) {
    content = (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: PAPER,
          padding: '52px 64px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Violet top accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: ACCENT, display: 'flex' }} />

        {/* Subtle grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(rgba(28,26,23,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(28,26,23,0.04) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            display: 'flex',
          }}
        />

        {/* Brand + meta */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 36 }}>
          <span style={{ fontSize: 15, letterSpacing: '0.2em', color: ACCENT, fontFamily: bebasFamily }}>
            ACE · CHRONICLE
          </span>
          <div style={{ flex: 1, display: 'flex' }} />
          <span style={{ fontSize: 12, color: MUTED, fontFamily: 'sans-serif', letterSpacing: '0.06em' }}>
            {[tourn, year, round].filter(Boolean).join(' · ')}
          </span>
        </div>

        {/* Winner row */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 40, marginBottom: 16 }}>
          <span style={{ fontSize: 92, color: ACCENT, lineHeight: 1, fontFamily: bebasFamily, letterSpacing: '0.02em' }}>
            {winner.toUpperCase()}
          </span>
          {score && (
            <span style={{ fontSize: 40, color: INK, lineHeight: 1, fontFamily: bebasFamily, letterSpacing: '0.06em', opacity: 0.75 }}>
              {score}
            </span>
          )}
        </div>

        {/* Separator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ height: 1, width: 32, background: 'rgba(28,26,23,0.18)', display: 'flex' }} />
          <span style={{ fontSize: 11, color: MUTED, fontFamily: 'sans-serif', letterSpacing: '0.12em' }}>b.</span>
          <div style={{ height: 1, flex: 1, background: 'rgba(28,26,23,0.08)', display: 'flex' }} />
        </div>

        {/* Loser */}
        <span style={{ fontSize: 54, color: 'rgba(28,26,23,0.3)', lineHeight: 1, fontFamily: bebasFamily, letterSpacing: '0.02em' }}>
          {loser.toUpperCase()}
        </span>

        <div style={{ flex: 1, display: 'flex' }} />

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(28,26,23,0.1)', paddingTop: 16 }}>
          <span style={{ fontSize: 11, color: MUTED, fontFamily: 'sans-serif' }}>acechronicle.it</span>
          <span style={{ fontSize: 11, color: GOLD, fontFamily: 'sans-serif', letterSpacing: '0.06em' }}>ARCHIVIO TENNIS 1980-2002</span>
        </div>
      </div>
    )
  } else if (type === 'player' && player) {
    const parts     = player.split(' ')
    const firstName = parts.length > 1 ? parts.slice(0, -1).join(' ') : ''
    const lastName  = parts.at(-1) ?? player

    content = (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: INK,
          padding: '52px 64px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: ACCENT, display: 'flex' }} />

        {/* Watermark */}
        <div
          style={{
            position: 'absolute',
            right: -10,
            bottom: -50,
            fontSize: 240,
            color: 'white',
            opacity: 0.04,
            fontFamily: bebasFamily,
            lineHeight: 1,
            display: 'flex',
          }}
        >
          {lastName.toUpperCase().slice(0, 5)}
        </div>

        {/* Brand */}
        <span style={{ fontSize: 15, letterSpacing: '0.2em', color: ACCENT, fontFamily: bebasFamily, marginBottom: 48 }}>
          ACE · CHRONICLE
        </span>

        {/* Name */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          {firstName && (
            <span style={{ fontSize: 42, color: 'rgba(255,255,255,0.4)', lineHeight: 1, fontFamily: bebasFamily, letterSpacing: '0.04em', marginBottom: 4 }}>
              {firstName.toUpperCase()}
            </span>
          )}
          <span style={{ fontSize: 108, color: '#FFFFFF', lineHeight: 0.9, fontFamily: bebasFamily, letterSpacing: '0.02em' }}>
            {lastName.toUpperCase()}
          </span>
          {sub && (
            <span style={{ fontSize: 13, color: GOLD, marginTop: 20, fontFamily: 'sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {sub}
            </span>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: 'sans-serif' }}>acechronicle.it</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: 'sans-serif', letterSpacing: '0.06em' }}>ARCHIVIO TENNIS 1980-2002</span>
        </div>
      </div>
    )
  } else {
    // Default homepage OG
    content = (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: INK,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: ACCENT, display: 'flex' }} />
        <div
          style={{
            position: 'absolute',
            fontSize: 320,
            color: 'white',
            opacity: 0.03,
            fontFamily: bebasFamily,
            lineHeight: 1,
            display: 'flex',
          }}
        >
          ACE
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <span style={{ fontSize: 28, letterSpacing: '0.22em', color: ACCENT, fontFamily: bebasFamily }}>
            ACE · CHRONICLE
          </span>
          <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', fontFamily: 'sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Archivio tennis 1980-2002
          </span>
        </div>

        <div style={{ position: 'absolute', bottom: 28, display: 'flex' }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontFamily: 'sans-serif' }}>acechronicle.it</span>
        </div>
      </div>
    )
  }

  return new ImageResponse(content, { width: 1200, height: 630, fonts })
}
