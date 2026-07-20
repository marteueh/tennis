import type { Metadata } from 'next'
import Link from 'next/link'
import { getTournaments } from '@/lib/supabase'
import type { Tournament } from '@/lib/types'
import { SURFACE_LABELS } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Tornei — Archivio 1980-2002',
  description: 'I Grandi Slam e i principali tornei del circuito ATP dal 1980 al 2002.',
}

const MOCK_TOURNAMENTS: Tournament[] = [
  { id: 1, slug: 'australian-open', name: 'Australian Open', name_it: 'Australian Open', surface: 'Hard',  category: 'GrandSlam', country_code: 'AUS', city: 'Melbourne' },
  { id: 2, slug: 'roland-garros',   name: 'Roland Garros',   name_it: 'Roland Garros',   surface: 'Clay',  category: 'GrandSlam', country_code: 'FRA', city: 'Parigi' },
  { id: 3, slug: 'wimbledon',       name: 'Wimbledon',       name_it: 'Wimbledon',       surface: 'Grass', category: 'GrandSlam', country_code: 'GBR', city: 'Londra' },
  { id: 4, slug: 'us-open',         name: 'US Open',         name_it: 'US Open',         surface: 'Hard',  category: 'GrandSlam', country_code: 'USA', city: 'New York' },
]

const SLAM_COLORS: Record<string, string> = {
  'australian-open': '#1A5A9A',
  'roland-garros':   '#8B3A1A',
  'wimbledon':       '#2A5A2A',
  'us-open':         '#1A2A5A',
}

// Brevi introduzioni editoriali per ogni torneo
const TOURNAMENT_INTROS: Record<string, string> = {
  'australian-open':
    'Il primo Slam dell\'anno. Cemento di Melbourne sotto il sole estivo, scenario d\'apertura per ogni stagione tennistica dal 1985 in poi (prima Kooyong, dal 1988 Flinders Park, oggi Rod Laver Arena). Negli anni \'80 era il torneo trascurato dai big; dal 1989 in poi è diventato palco di consacrazioni — Lendl, Edberg, Courier, Sampras, Agassi.',
  'roland-garros':
    'La terra rossa di Parigi. Il torneo più tecnico, più lungo, più filosofico — cinque set, scivolate, costruzione del punto. Dominio assoluto degli specialisti: Wilander, Lendl, Bruguera, Muster, Kuerten. La finale 1989 Chang–Edberg e quella 1999 Agassi–Medvedev sono leggenda. L\'unico Slam che Sampras non vinse mai.',
  'wimbledon':
    'L\'erba di Church Road. Il torneo più antico, il più imitato e il meno imitabile. Tradizione (bianco rigoroso, no sponsor sui campi), tempo (Slam più lungo del calendario in passato), e tecnica del servizio-volée portata al suo apice da Sampras (7 titoli in 8 anni) e prima ancora da Becker, Edberg, McEnroe.',
  'us-open':
    'New York. Cemento veloce, riflettori, vento sull\'Arthur Ashe Stadium. Il più rumoroso degli Slam, il più americano nello spirito: tie-break al quinto, sessioni serali, pubblico partecipe. La finale 1995 Sampras–Agassi e quella 1991 Connors–Krickstein (semi) restano nell\'epica. Vincono tutti, ma sempre con un colpo di teatro.',
}

async function getTournamentList(): Promise<Tournament[]> {
  try {
    const data = await getTournaments()
    return data.length > 0 ? data : MOCK_TOURNAMENTS
  } catch {
    return MOCK_TOURNAMENTS
  }
}

export default async function TorneiPage() {
  const tournaments = await getTournamentList()
  const slams  = tournaments.filter(t => t.category === 'GrandSlam')
  const others = tournaments.filter(t => t.category !== 'GrandSlam')

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div style={{ marginBottom: 40 }}>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#7A7870',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ display: 'inline-block', width: 20, height: 1, background: '#7A7870', opacity: 0.4 }} />
          Archivio
        </p>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 38, lineHeight: 1.1, color: '#1A1A1A' }}>
          Tornei
        </h1>
        <p style={{ marginTop: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#7A7870' }}>
          Dai Grandi Slam ai Masters Series — il circuito ATP 1980-2002
        </p>
      </div>

      {/* Grandi Slam */}
      <section style={{ marginBottom: 48 }}>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#C8A85C',
            marginBottom: 16,
          }}
        >
          Grandi Slam
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {slams.map((t) => (
            <TournamentCard key={t.id} tournament={t} accent={SLAM_COLORS[t.slug] ?? '#534AB7'} />
          ))}
        </div>
      </section>

      {/* Altri tornei */}
      {others.length > 0 && (
        <section>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#7A7870',
              marginBottom: 16,
            }}
          >
            Masters Series e ATP
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {others.map((t) => (
              <TournamentCard key={t.id} tournament={t} accent="#534AB7" compact />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function TournamentCard({
  tournament,
  accent,
  compact = false,
}: {
  tournament: Tournament
  accent: string
  compact?: boolean
}) {
  const intro = TOURNAMENT_INTROS[tournament.slug]
  return (
    <Link href={`/tornei/${tournament.slug}`} style={{ textDecoration: 'none' }}>
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(26,26,26,0.08)',
          borderTop: `3px solid ${accent}`,
          borderRadius: 2,
          padding: compact ? '16px 18px' : '22px 22px 20px',
          transition: 'border-color 0.15s',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <p
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: compact ? 17 : 22,
            fontWeight: 600,
            color: '#1A1A1A',
            lineHeight: 1.1,
            marginBottom: 6,
          }}
        >
          {tournament.name_it ?? tournament.name}
        </p>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            color: '#7A7870',
            letterSpacing: '0.04em',
            marginBottom: !compact && intro ? 14 : 0,
          }}
        >
          {tournament.city ?? ''} · {tournament.surface ? (SURFACE_LABELS[tournament.surface] ?? tournament.surface) : ''}
        </p>
        {!compact && intro && (
          <p
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontStyle: 'italic',
              fontSize: 13,
              lineHeight: 1.65,
              color: '#1A1A1A',
              flex: 1,
            }}
          >
            {intro}
          </p>
        )}
        {!compact && (
          <p
            style={{
              marginTop: 14,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              fontWeight: 500,
              color: accent,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Esplora storico →
          </p>
        )}
      </div>
    </Link>
  )
}
