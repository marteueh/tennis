import Link from 'next/link'
import { getAdminCounts, type AdminCounts } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  let counts: AdminCounts | null = null
  let error: string | null = null
  try {
    counts = await getAdminCounts()
  } catch (e) {
    error = (e as Error).message
  }

  const sections = [
    {
      href: '/admin/players',
      title: 'Giocatori',
      desc: 'Foto, biografie, link Clerici, riquadri culturali',
      stat: counts ? `${counts.players_with_photo} foto · ${counts.players_with_bio} bio · ${counts.players} totali` : '—',
    },
    {
      href: '/admin/matches',
      title: 'Partite',
      desc: 'Video, note editoriali, riquadri culturali',
      stat: counts ? `${counts.matches_with_video} video · ${counts.matches_with_clerici} estratti · ${counts.matches} totali` : '—',
    },
    {
      href: '/admin/tournaments',
      title: 'Tornei',
      desc: 'Riquadri culturali a livello torneo',
      stat: counts ? `${counts.tournaments} tornei` : '—',
    },
    {
      href: '/admin/youtube',
      title: 'YouTube (modalità rapida)',
      desc: 'Inserimento/correzione massiva video',
      stat: counts ? `${counts.matches_with_video} con video` : '—',
    },
    {
      href: '/admin/clerici',
      title: 'Clerici (estratti)',
      desc: 'Estratti articoli Repubblica',
      stat: counts ? `${counts.matches_with_clerici} con estratto` : '—',
    },
  ]

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ marginBottom: 36 }}>
        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7C7568', marginBottom: 6 }}>
          Pannello redazionale
        </p>
        <h1 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 36, color: '#1C1A17', lineHeight: 1.1 }}>
          Dashboard
        </h1>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 4, marginBottom: 24, fontSize: 13, color: '#991B1B' }}>
          DB non raggiungibile: {error}
        </div>
      )}

      {counts && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(180px, 100%), 1fr))', gap: 12, marginBottom: 36 }}>
          {[
            { label: 'Giocatori',         value: counts.players,           color: '#1C1A17' },
            { label: 'Partite',           value: counts.matches,           color: '#1C1A17' },
            { label: 'Tornei',            value: counts.tournaments,       color: '#1C1A17' },
            { label: 'Riquadri culturali', value: counts.cultural_impacts, color: '#9C7C3E' },
            { label: 'Video YouTube',     value: counts.matches_with_video, color: '#B54A2C' },
            { label: 'Estratti Clerici',  value: counts.matches_with_clerici, color: '#B54A2C' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                background: '#FFFFFF',
                border: '1px solid rgba(28,26,23,0.08)',
                borderRadius: 2,
                padding: '16px 18px',
              }}
            >
              <p style={{
                fontFamily: "'Source Serif 4', Georgia, serif",
                fontSize: 28, fontWeight: 600, color, lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {value.toLocaleString('it-IT')}
              </p>
              <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7C7568', marginTop: 6 }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: 12 }}>
        {sections.map(s => (
          <Link
            key={s.href}
            href={s.href}
            style={{
              textDecoration: 'none',
              background: '#FFFFFF',
              border: '1px solid rgba(28,26,23,0.08)',
              borderLeft: '3px solid #B54A2C',
              borderRadius: 2,
              padding: '20px 22px',
              display: 'block',
              transition: 'border-color 0.15s',
            }}
            className="hover:border-l-accent"
          >
            <p style={{
              fontFamily: "'Source Serif 4', Georgia, serif",
              fontSize: 18, fontWeight: 600, color: '#1C1A17', marginBottom: 6,
            }}>
              {s.title}
            </p>
            <p style={{ fontSize: 13, color: '#7C7568', marginBottom: 10, lineHeight: 1.5 }}>
              {s.desc}
            </p>
            <p style={{ fontSize: 11, color: '#B54A2C', letterSpacing: '0.06em', fontWeight: 500 }}>
              {s.stat}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
