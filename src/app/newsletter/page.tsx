import type { Metadata } from 'next'
import { NewsletterForm } from '@/components/NewsletterForm'
import { SectionDivider } from '@/components/SectionDivider'

export const metadata: Metadata = {
  title: 'Newsletter — Una partita ogni martedì',
  description:
    'Iscriviti alla newsletter di Ace Chronicle. Ogni martedì: una partita storica del periodo 1980-2002, statistiche complete, video e la voce di Gianni Clerici.',
}

const PAST_EDITIONS = [
  {
    week: '22 aprile 2025',
    title: 'Sampras b. Agassi, US Open 1995',
    subtitle: 'La finale che consacrò Pistol Pete',
    slug: 'pete-sampras-vs-andre-agassi-us-open-1995-f',
  },
  {
    week: '15 aprile 2025',
    title: 'Agassi b. Sampras, Australian Open 1995',
    subtitle: 'Melbourne: quando Agassi trovò se stesso',
    slug: 'andre-agassi-vs-pete-sampras-australian-open-1995-f',
  },
]

export default function NewsletterPage() {
  return (
    <>
      {/* Hero */}
      <section
        className="hero-loc-texture"
        style={{
          background: '#1C1A17',
          padding: '72px 0 64px',
          position: 'relative',
          overflow: 'hidden',
          '--hero-loc-image': "url('/loc/loc-tennis-player.jpg')",
        } as React.CSSProperties}
      >
        <div className="hero-grid" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
        <div className="max-w-7xl mx-auto px-6" style={{ maxWidth: 640, position: 'relative', zIndex: 1 }}>
          <p
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#9C7C3E',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ display: 'inline-block', width: 24, height: 1, background: '#9C7C3E' }} />
            Newsletter settimanale
          </p>
          <h1
            style={{
              fontFamily: "'Source Serif 4', serif",
              fontSize: 'clamp(32px, 5vw, 48px)',
              lineHeight: 1.1,
              color: '#FFFFFF',
              marginBottom: 20,
            }}
          >
            Una partita.<br />Ogni martedì.
          </h1>
          <p
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 15,
              lineHeight: 1.7,
              color: 'rgba(255,255,255,0.5)',
              marginBottom: 32,
            }}
          >
            Statistiche complete, video dal canale ufficiale e un estratto di Gianni Clerici
            su una partita storica degli anni &#39;90. Nessuno spam. Disdici quando vuoi.
          </p>
          <NewsletterForm source="newsletter-page" />
          <p
            style={{
              marginTop: 12,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 11,
              color: 'rgba(255,255,255,0.2)',
              letterSpacing: '0.04em',
            }}
          >
            Gestita su Beehiiv · Gratuita per sempre nella fase 1 del progetto
          </p>
        </div>
      </section>

      {/* Cosa aspettarsi */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px, 100%), 1fr))',
            gap: 16,
            marginBottom: 56,
          }}
        >
          {[
            {
              icon: '📊',
              title: 'Statistiche complete',
              body: 'Ace, doppi falli, percentuali di prima, palle break salvate. Tutto dal dataset Sackmann.',
            },
            {
              icon: '▶',
              title: 'Video storico',
              body: 'Quando disponibile, il match integrale dal canale YouTube ufficiale dello Slam.',
            },
            {
              icon: '✒',
              title: 'La voce di Clerici',
              body: 'Un estratto dalla cronaca di Gianni Clerici con link all\'articolo originale.',
            },
            {
              icon: '📅',
              title: 'Ogni martedì',
              body: 'Un\'edizione a settimana. Non ti sommergiamo — vogliamo che tu la legga davvero.',
            },
          ].map(({ icon, title, body }) => (
            <div
              key={title}
              style={{
                background: '#FFFFFF',
                border: '1px solid rgba(28,26,23,0.08)',
                borderRadius: 2,
                padding: '20px',
              }}
            >
              <p
                style={{
                  fontSize: 24,
                  marginBottom: 12,
                  lineHeight: 1,
                }}
              >
                {icon}
              </p>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 600, color: '#1C1A17', marginBottom: 6 }}>
                {title}
              </p>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, lineHeight: 1.65, color: '#7C7568' }}>
                {body}
              </p>
            </div>
          ))}
        </div>

        <SectionDivider />

        {/* Archivio edizioni passate */}
        <div>
          <p
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#7C7568',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ display: 'inline-block', width: 20, height: 1, background: '#7C7568', opacity: 0.4 }} />
            Edizioni passate
          </p>
          <h2 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 26, color: '#1C1A17', marginBottom: 24 }}>
            Archivio newsletter
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {PAST_EDITIONS.map((ed) => (
              <div
                key={ed.slug}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 0',
                  borderBottom: '1px solid rgba(28,26,23,0.06)',
                  gap: 16,
                }}
              >
                <div>
                  <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: '#7C7568', marginBottom: 4 }}>
                    {ed.week}
                  </p>
                  <p style={{ fontFamily: "'Source Serif 4', serif", fontSize: 16, color: '#1C1A17', marginBottom: 2 }}>
                    {ed.title}
                  </p>
                  <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: '#7C7568', fontStyle: 'italic' }}>
                    {ed.subtitle}
                  </p>
                </div>
                <a
                  href={`/partite/${ed.slug}`}
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 11,
                    fontWeight: 500,
                    color: '#B54A2C',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.04em',
                  }}
                >
                  Leggi →
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
