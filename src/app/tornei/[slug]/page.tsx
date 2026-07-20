import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTournamentBySlug, getTournamentYears, getCulturalImpactsForTournament } from '@/lib/supabase'
import type { Tournament, CulturalImpact } from '@/lib/types'
import { SURFACE_LABELS } from '@/lib/types'
import { CulturalImpactSection } from '@/components/CulturalImpactCard'

const MOCK_TOURNAMENT: Tournament = {
  id: 4, slug: 'us-open', name: 'US Open', name_it: 'US Open',
  surface: 'Hard', category: 'GrandSlam', country_code: 'USA', city: 'New York',
}

// ── Storia editoriale di ciascun torneo (visualizzata nella pagina dettaglio) ──
interface TournamentLore {
  subtitle: string
  paragraphs: string[]
  facts: { label: string; value: string }[]
}

const TOURNAMENT_LORE: Record<string, TournamentLore> = {
  'australian-open': {
    subtitle: 'Il primo Slam dell\'anno, il più giovane della modernità',
    paragraphs: [
      'Fino al 1986 si gioca a Kooyong, su un\'erba australe ormai logora e fuori stagione: per molti big è un torneo da saltare, complice il fuso e le distanze. Nel 1987 l\'edizione viene posticipata a gennaio per riposizionarsi nel calendario internazionale, e nel 1988 il torneo trasloca a Flinders Park (oggi Melbourne Park) inaugurando i campi in cemento.',
      'Da quel momento l\'Australian Open diventa il vero "primo Slam dell\'anno" — palco di consacrazioni (Lendl 1989-90, Edberg 1985-87, Courier 1992-93, Sampras 1994-97, Agassi 1995 e 2000-01-03) e di sorprese (Korda 1998, Johansson 2002). Il Rod Laver Arena, intitolato al campione nel 2000, diventa l\'arena coperta più tecnologica del circuito.',
      'È lo Slam dell\'estate australiana — caldo soffocante, sessioni serali, australiani di passaggio, sguardo che già guarda alla stagione che inizia.',
    ],
    facts: [
      { label: 'Superficie',     value: 'Cemento (Rebound Ace, poi Plexicushion)' },
      { label: 'Sede storica',   value: 'Kooyong fino 1987 · Flinders/Melbourne Park dal 1988' },
      { label: 'Periodo',        value: 'Dicembre fino 1985 · Gennaio dal 1987' },
      { label: 'Italiani vincitori', value: 'Nessun italiano nel periodo 1980-2002' },
    ],
  },
  'roland-garros': {
    subtitle: 'La terra rossa di Parigi, il più tecnico degli Slam',
    paragraphs: [
      'Cinque set sulla terra rossa più lenta del circuito. Il Roland Garros è il torneo più lungo, più filosofico, più rituale: si vince costruendo il punto, scivolando come pattinatori, sopportando il vento del Bois de Boulogne. Tutti i campi sono in terra battuta — anche per gli allenamenti.',
      'È il torneo degli specialisti — Wilander (1982-85-88), Lendl (1984-86-87), Chang (1989, a 17 anni), Bruguera (1993-94), Muster (1995), Kafelnikov (1996), Kuerten (1997-2000-01). E il torneo che Pete Sampras non vinse mai, in tredici partecipazioni: l\'unica lacuna del suo Career Slam.',
      'Il momento di gloria italiana arriva nel 1976 con Adriano Panatta (fuori dal nostro periodo), ma negli anni Ottanta-Novanta sono Italia centrale per Clerici — la rincorsa di Chang e il pianto di Medvedev nel 1999 restano materia di cronaca leggendaria.',
    ],
    facts: [
      { label: 'Superficie',     value: 'Terra rossa (battuta francese)' },
      { label: 'Sede',           value: 'Stade Roland Garros, Parigi (campo Philippe Chatrier)' },
      { label: 'Periodo',        value: 'Fine maggio — inizio giugno' },
      { label: 'Italiani vincitori', value: 'Nessun italiano nel periodo 1980-2002' },
    ],
  },
  'wimbledon': {
    subtitle: 'L\'erba di Church Road, il più antico e il meno imitabile',
    paragraphs: [
      'Il torneo più antico del tennis moderno (1877) è anche il più tradizionalista. Tenuta bianca obbligatoria per tutti i giocatori, nessuna pubblicità sui campi, fragole con la panna, royal box, Centre Court con il tetto retrattile (dal 2009, oltre il nostro periodo). L\'erba di Church Road resta la superficie più tecnica: il rimbalzo basso premia il serve-and-volley, la prima palla, l\'attacco a rete.',
      'Negli anni 1980-2002 Wimbledon è il regno dei serve-and-volleyer: Borg (5 titoli consecutivi 1976-80), McEnroe (1981-83-84), Becker (1985-86-89), Edberg (1988-90), Sampras (1993-95, 1997-2000 — sette finali, sette vittorie), Krajicek (1996), Ivanisevic (2001 da wild card). L\'erba decide chi sa giocare a tennis come uno scacchista, non solo come un metronomo.',
      'È lo Slam del rispetto: l\'inchino alla famiglia reale, il silenzio durante lo scambio, la cravatta nera dei giudici. E dello spettacolo: la finale 1980 Borg-McEnroe (tie-break 18-16), la finale 2001 Goran-Rafter (5 set epici), la finale 1999 Graf-Hingis nel femminile. Materia per Clerici, che a Wimbledon è stato presente cinquant\'anni.',
    ],
    facts: [
      { label: 'Superficie',     value: 'Erba (rye grass, taglio 8mm)' },
      { label: 'Sede',           value: 'All England Lawn Tennis Club, Wimbledon (Londra SW19)' },
      { label: 'Periodo',        value: 'Fine giugno — inizio luglio (due settimane)' },
      { label: 'Italiani vincitori', value: 'Nessun italiano nel periodo 1980-2002' },
    ],
  },
  'us-open': {
    subtitle: 'New York, lo Slam più americano e più rumoroso',
    paragraphs: [
      'Si è giocato a Forest Hills fino al 1977 — anche su erba e terra rossa — poi nel 1978 il torneo trasloca al National Tennis Center di Flushing Meadows, Queens. Cemento veloce DecoTurf, tribune che amplificano i decibel, traffico delle 5th Avenue come colonna sonora, voli che decollano da LaGuardia sopra l\'Arthur Ashe Stadium (inaugurato nel 1997).',
      'È lo Slam con il pubblico più rumoroso: applausi durante lo scambio, urla tra il primo e il secondo servizio, e dal 1975 i tie-break in tutti i set inclusi il quinto. Le sessioni serali (introdotte nel 1975) diventano momenti epici — Connors-Krickstein 1991 finita oltre la mezzanotte, Sampras-Corretja 1996 (vomito in campo nel tie-break), Agassi che torna numero uno dopo aver toccato il fondo (1999).',
      'Le finali di questo periodo sono leggenda: Borg-McEnroe 1981 (l\'ultima di Borg in carriera, perde e sparisce), Connors 1982-83, Lendl tre vittorie consecutive 1985-86-87, Becker 1989, Sampras cinque volte (1990-93-95-96-2002 — l\'ultima a 31 anni, anche ultimo titolo della carriera), Agassi 1994 e 1999, Safin 2000 (a 20 anni rifila 6-4 6-3 6-3 a Sampras nella finale più rapida di sempre), Hewitt 2001.',
    ],
    facts: [
      { label: 'Superficie',     value: 'Cemento (DecoTurf) dal 1978' },
      { label: 'Sede',           value: 'USTA Billie Jean King National Tennis Center, Flushing Meadows' },
      { label: 'Periodo',        value: 'Fine agosto — inizio settembre (ultimo Slam dell\'anno)' },
      { label: 'Italiani vincitori', value: 'Nessun italiano nel periodo 1980-2002' },
    ],
  },
}

async function getData(slug: string): Promise<{ tournament: Tournament; years: number[] } | null> {
  try {
    const t = await getTournamentBySlug(slug)
    const tournament = t ?? (slug === MOCK_TOURNAMENT.slug ? MOCK_TOURNAMENT : null)
    if (!tournament) return null
    const years = await getTournamentYears(slug)
    return { tournament, years }
  } catch {
    if (slug === MOCK_TOURNAMENT.slug) {
      return { tournament: MOCK_TOURNAMENT, years: Array.from({ length: 23 }, (_, i) => 2002 - i) }
    }
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const data = await getData(slug)
  if (!data) return {}
  const { tournament } = data
  const name = tournament.name_it ?? tournament.name
  const ogParams = new URLSearchParams({
    type: 'default',
    winner: name,
    sub: `${tournament.category} · ${tournament.city}`,
  })
  return {
    title: `${name} — Storico 1980–2002`,
    description: `Tutte le partite del ${name} dal 1980 al 2002. Statistiche, video e cronache.`,
    openGraph: {
      title: name,
      images: [{ url: `/api/og?${ogParams}`, width: 1200, height: 630, alt: name }],
    },
    twitter: {
      card: 'summary_large_image',
      images: [`/api/og?${ogParams}`],
    },
  }
}

export default async function TorneoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = await getData(slug)
  if (!data) notFound()

  let culturalItems: CulturalImpact[] = []
  try {
    culturalItems = await getCulturalImpactsForTournament(data.tournament.id)
  } catch { /* DB non disponibile */ }

  const { tournament, years } = data!
  const name = tournament.name_it ?? tournament.name

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <nav style={{ marginBottom: 32, display: 'flex', gap: 8, alignItems: 'center' }}>
        <Link href="/tornei" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#7A7870', textDecoration: 'none' }}>Tornei</Link>
        <span style={{ color: 'rgba(26,26,26,0.2)', fontSize: 12 }}>›</span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#1A1A1A' }}>{name}</span>
      </nav>

      {/* Hero torneo */}
      <div
        style={{
          borderBottom: '2px solid #1A1A1A',
          paddingBottom: 32,
          marginBottom: 48,
        }}
      >
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C8A85C', marginBottom: 10 }}>
          {tournament.category} · {tournament.city} · {tournament.country_code}
        </p>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 700, letterSpacing: '-0.01em', color: '#1A1A1A', lineHeight: 1.05, marginBottom: 14 }}>
          {name}
        </h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#7A7870' }}>
          {tournament.surface ? (SURFACE_LABELS[tournament.surface] ?? tournament.surface) : ''} · Storico 1980–2002 · {years.length} edizioni nell&#39;archivio
        </p>
      </div>

      {/* Storia del torneo (cenni editoriali) */}
      {TOURNAMENT_LORE[slug] && (
        <section style={{ marginBottom: 48 }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase',
            color: '#7A7870', marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ display: 'inline-block', width: 20, height: 1, background: '#7A7870', opacity: 0.4 }} />
            Storia del torneo
          </p>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 24, color: '#1A1A1A', lineHeight: 1.3,
            marginBottom: 20, maxWidth: 720,
          }}>
            {TOURNAMENT_LORE[slug].subtitle}
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) 260px',
              gap: 36,
              alignItems: 'start',
            }}
            className="grid-cols-1 md:grid-cols-[1fr_260px]"
          >
            {/* Paragrafi */}
            <div>
              {TOURNAMENT_LORE[slug].paragraphs.map((p, i) => (
                <p key={i} style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14, lineHeight: 1.75, color: '#1A1A1A',
                  marginBottom: 14,
                }}>
                  {p}
                </p>
              ))}
            </div>

            {/* Box facts */}
            <aside
              style={{
                background: '#FFFFFF',
                border: '1px solid rgba(26,26,26,0.08)',
                borderLeft: '3px solid #C8A85C',
                padding: '16px 18px',
                borderRadius: '0 2px 2px 0',
              }}
            >
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 9, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase',
                color: '#7A7870', marginBottom: 12,
              }}>
                Scheda tecnica
              </p>
              {TOURNAMENT_LORE[slug].facts.map((f, i) => (
                <div key={i} style={{
                  paddingBottom: 10, marginBottom: 10,
                  borderBottom: i < TOURNAMENT_LORE[slug].facts.length - 1 ? '1px solid rgba(26,26,26,0.06)' : 'none',
                }}>
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 10, color: '#7A7870',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    marginBottom: 2,
                  }}>
                    {f.label}
                  </p>
                  <p style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: 13, color: '#1A1A1A', lineHeight: 1.4,
                  }}>
                    {f.value}
                  </p>
                </div>
              ))}
            </aside>
          </div>
        </section>
      )}

      {/* Eco culturale */}
      <CulturalImpactSection items={culturalItems} title="Eco culturale" />

      {/* Selezione anno */}
      <div style={{ marginBottom: 40 }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7A7870', marginBottom: 16 }}>
          Edizioni disponibili
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {years.map(year => (
            <Link
              key={year}
              href={`/tornei/${slug}/${year}`}
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: '0.02em',
                color: '#534AB7',
                textDecoration: 'none',
                padding: '8px 16px',
                border: '1px solid rgba(83,74,183,0.2)',
                borderRadius: 2,
                background: 'rgba(83,74,183,0.04)',
                transition: 'background 0.15s',
                fontVariantNumeric: 'tabular-nums',
              }}
              className="hover:bg-accent/10"
            >
              {year}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
