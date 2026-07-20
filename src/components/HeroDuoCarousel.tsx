'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

interface PlayerRef {
  src: string
  name: string
  years: string
  flag: string
  objectPosition?: string
}

interface Duo {
  era: string
  left: PlayerRef
  right: PlayerRef
}

const DUOS: Duo[] = [
  {
    era: 'Gli anni Ottanta',
    left:  { src: '/players/bjorn-borg.jpg',    name: 'Borg',    years: '1973–1981', flag: 'SWE', objectPosition: 'center 30%' },
    right: { src: '/players/john-mcenroe.png',  name: 'McEnroe', years: '1978–1992', flag: 'USA', objectPosition: 'center 30%' },
  },
  {
    era: 'Il duello stilistico',
    left:  { src: '/players/stefan-edberg.jpg', name: 'Edberg', years: '1983–1996', flag: 'SWE', objectPosition: 'center 25%' },
    right: { src: '/players/boris-becker.jpg',  name: 'Becker', years: '1984–1999', flag: 'GER', objectPosition: 'center 25%' },
  },
  {
    era: 'La rivalità definitiva',
    left:  { src: '/players/pete-sampras.jpg',  name: 'Sampras', years: '1988–2002', flag: 'USA', objectPosition: 'center 25%' },
    right: { src: '/players/andre-agassi.jpg',  name: 'Agassi',  years: '1986–2006', flag: 'USA', objectPosition: 'center 25%' },
  },
]

const FADE_DURATION = 800
const HOLD_DURATION = 5000

export function HeroDuoCarousel() {
  const [index, setIndex] = useState(0)
  const [opacity, setOpacity] = useState(1)

  useEffect(() => {
    const fadeOut = setTimeout(() => setOpacity(0), HOLD_DURATION)
    const swap = setTimeout(() => {
      setIndex(i => (i + 1) % DUOS.length)
      setOpacity(1)
    }, HOLD_DURATION + FADE_DURATION)
    return () => { clearTimeout(fadeOut); clearTimeout(swap) }
  }, [index])

  const duo = DUOS[index]

  return (
    <div
      className="hidden lg:flex"
      style={{
        flexShrink: 0,
        position: 'relative',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 12,
      }}
    >
      {/* Etichetta epoca */}
      <p
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 10, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase',
          color: 'rgba(156,124,62,0.7)',
          opacity, transition: `opacity ${FADE_DURATION}ms ease`,
          minHeight: 14,
        }}
      >
        {duo.era}
      </p>

      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'flex-end',
          opacity,
          transition: `opacity ${FADE_DURATION}ms ease`,
        }}
      >
        <DuelPortrait player={duo.left} />
        <DuelPortrait player={duo.right} offset />
      </div>

      {/* Dots indicator */}
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        {DUOS.map((_, i) => (
          <button
            key={i}
            onClick={() => { setOpacity(0); setTimeout(() => { setIndex(i); setOpacity(1) }, FADE_DURATION) }}
            aria-label={`Vai al dittico ${i + 1}`}
            style={{
              width: i === index ? 18 : 5,
              height: 5,
              borderRadius: 2,
              background: i === index ? '#9C7C3E' : 'rgba(255,255,255,0.25)',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              transition: 'width 0.3s ease, background 0.3s ease',
            }}
          />
        ))}
      </div>
    </div>
  )
}

function DuelPortrait({ player, offset }: { player: PlayerRef; offset?: boolean }) {
  return (
    <figure
      style={{
        width: 'clamp(160px, 17vw, 200px)',
        margin: 0,
        position: 'relative',
        transform: offset ? 'translateY(-22px)' : 'none',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '3/4',
          overflow: 'hidden',
          borderBottom: '3px solid #9C7C3E',
          background: 'rgba(255,255,255,0.04)',
        }}
      >
        <Image
          src={player.src}
          alt={player.name}
          fill
          sizes="200px"
          style={{
            objectFit: 'cover',
            objectPosition: player.objectPosition ?? 'center top',
            filter: 'grayscale(0.15) contrast(1.05)',
          }}
          unoptimized
          priority={false}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)',
          }}
        />
        <figcaption
          style={{
            position: 'absolute', bottom: 10, left: 12, right: 12, zIndex: 1,
          }}
        >
          <p style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: 18, fontWeight: 700,
            color: '#FFFFFF', lineHeight: 1, letterSpacing: '0.02em',
          }}>
            {player.name}
          </p>
          <p style={{
            marginTop: 4,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 9, fontWeight: 500,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.7)',
          }}>
            {player.flag} · {player.years}
          </p>
        </figcaption>
      </div>
    </figure>
  )
}
