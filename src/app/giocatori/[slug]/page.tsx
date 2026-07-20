import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ScoreCard } from '@/components/ScoreCard'
import { SectionDivider } from '@/components/SectionDivider'
import { CulturalImpactSection } from '@/components/CulturalImpactCard'
import { getPlayerBySlug, getMatchesByPlayer, getCulturalImpactsForPlayer } from '@/lib/supabase'
import type { Player, Match, CulturalImpact } from '@/lib/types'
import { playerFullName, formatDuration } from '@/lib/utils'

// Dati mock
const MOCK_PLAYER: Player = {
  id: 1, sackmann_id: null, slug: 'pete-sampras',
  first_name: 'Pete', last_name: 'Sampras',
  country_code: 'USA', hand: 'R', birth_date: '1971-08-12', height_cm: 185,
  atp_peak_rank: 1, grand_slams: 14, active_from: 1988, active_to: 2002,
  bio_it: 'Pete Sampras è stato il dominatore assoluto del tennis degli anni \'90. Con 14 titoli del Grande Slam, sei Wimbledon consecutivi e una presenza in cima al ranking per sei stagioni consecutive, Sampras ha ridefinito il concetto di eccellenza nel tennis maschile. Il suo servizio era considerato il più letale della storia, il suo rovescio slice un\'opera d\'arte difensiva. Gianni Clerici lo chiamò "Pistol Pete", nome che rimase per sempre.',
  bio_en: null,
  bio_source: null,
  clerici_url: 'https://ricerca.repubblica.it/ricerca/repubblica?query=Gianni+Clerici+Sampras',
  photo_url: null,
  photo_credit: null,
}

const MOCK_MATCHES: Match[] = [
  {
    id: 1, sackmann_id: null, slug: 'pete-sampras-vs-andre-agassi-us-open-1995-f',
    tournament_id: 1, year: 1995, match_date: '1995-09-10', round: 'F',
    surface: 'Hard', winner_id: 1, loser_id: 2,
    winner_rank: 1, loser_rank: 2, score: '6-4 6-3 4-6 7-5', duration_min: 183,
    tournament: { id: 1, slug: 'us-open', name: 'US Open', name_it: 'US Open', surface: 'Hard', category: 'GrandSlam', country_code: 'USA', city: 'New York' },
    winner: MOCK_PLAYER,
    loser:  { id: 2, sackmann_id: null, slug: 'andre-agassi', first_name: 'Andre', last_name: 'Agassi', country_code: 'USA', hand: 'R', birth_date: null, height_cm: 180, atp_peak_rank: 1, grand_slams: 8, active_from: 1986, active_to: 2006, bio_it: null, bio_en: null, bio_source: null, clerici_url: null, photo_url: null, photo_credit: null },
    w_ace: 12, w_df: 2, w_svpt: 98, w_1stIn: 68, w_1stWon: 54, w_2ndWon: 18, w_SvGms: 17, w_bpSaved: 4, w_bpFaced: 6,
    l_ace: 4, l_df: 4, l_svpt: 92, l_1stIn: 58, l_1stWon: 40, l_2ndWon: 14, l_SvGms: 16, l_bpSaved: 3, l_bpFaced: 8,
    youtube_video_id: null, youtube_channel: null, youtube_verified_at: null, youtube_tommasi_id: null, youtube_tommasi_channel: null, youtube_tommasi_searched_at: null,
    clerici_article_url: null, clerici_excerpt_it: null, editorial_note_it: null,
    clerici_source: null, clerici_article_title: null, clerici_verified_at: null, featured: true, featured_week: '1995-09-10',
  },
]

async function getData(slug: string): Promise<{ player: Player; matches: Match[] } | null> {
  try {
    const player = await getPlayerBySlug(slug)
    if (player) {
      const matches = await getMatchesByPlayer(slug)
      return { player, matches }
    }
    if (slug === MOCK_PLAYER.slug) {
      return { player: MOCK_PLAYER, matches: MOCK_MATCHES }
    }
    return null
  } catch {
    if (slug === MOCK_PLAYER.slug) {
      return { player: MOCK_PLAYER, matches: MOCK_MATCHES }
    }
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const data = await getData(slug)
  if (!data) return {}
  const { player } = data
  const name = playerFullName(player)
  const ogParams = new URLSearchParams({
    type:   'player',
    player: name,
    sub:    `${player.grand_slams} Grandi Slam · ${player.active_from ?? '?'}–${player.active_to ?? '?'}`,
  })

  return {
    title: `${name} — Career stats ${player.active_from ?? ''}–${player.active_to ?? ''}`,
    description: `Statistiche di carriera, partite e la voce di Gianni Clerici su ${name}.`,
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

export default async function GiocatorePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const data = await getData(slug)
  if (!data) notFound()

  let culturalItems: CulturalImpact[] = []
  try {
    culturalItems = await getCulturalImpactsForPlayer(data.player.id)
  } catch { /* DB non disponibile */ }

  const { player, matches } = data
  const wins   = matches.filter(m => m.winner_id === player.id)
  const losses = matches.filter(m => m.loser_id  === player.id)

  const slamWins = wins.filter(m => m.tournament?.category === 'GrandSlam')

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">

      {/* Breadcrumb */}
      <nav style={{ marginBottom: 32, display: 'flex', gap: 8, alignItems: 'center' }}>
        <Link href="/giocatori" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#7A7870', textDecoration: 'none' }}>
          Giocatori
        </Link>
        <span style={{ color: 'rgba(26,26,26,0.2)', fontSize: 12 }}>›</span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#1A1A1A' }}>
          {playerFullName(player)}
        </span>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 40, alignItems: 'start' }}>

        {/* ── Colonna principale ── */}
        <div>
          {/* Hero giocatore */}
          <div
            style={{
              borderBottom: '2px solid #1A1A1A',
              paddingBottom: 32,
              marginBottom: 40,
              display: 'grid',
              gridTemplateColumns: player.photo_url ? '1fr auto' : '1fr',
              gap: 32,
              alignItems: 'end',
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#C8A85C',
                  marginBottom: 10,
                }}
              >
                {player.country_code} · {player.active_from}–{player.active_to}
              </p>
              <h1
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 'clamp(36px, 5vw, 64px)',
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  color: '#1A1A1A',
                  lineHeight: 1.05,
                  marginBottom: 28,
                }}
              >
                {player.first_name}<br />{player.last_name}
              </h1>

              {/* Stat hero */}
              <div style={{ display: 'flex', gap: 36, flexWrap: 'wrap' }}>
                {[
                  { num: player.grand_slams,         label: 'Grandi Slam', gold: true },
                  { num: `#${player.atp_peak_rank}`, label: 'Best Rank',   gold: false },
                  { num: wins.length,                label: 'Vittorie',    gold: false },
                  { num: `${player.height_cm} cm`,   label: 'Altezza',     gold: false },
                ].map(({ num, label, gold }) => (
                  <div key={label}>
                    <p
                      style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: 32,
                        fontWeight: 600,
                        color: gold ? '#C8A85C' : '#1A1A1A',
                        lineHeight: 1,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {num ?? '–'}
                    </p>
                    <p
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 9,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: '#7A7870',
                        marginTop: 4,
                      }}
                    >
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Foto giocatore */}
            {player.photo_url && (
              <div
                style={{
                  width: 'clamp(120px, 15vw, 200px)',
                  aspectRatio: '3/4',
                  position: 'relative',
                  overflow: 'hidden',
                  flexShrink: 0,
                  borderBottom: '3px solid #C8A85C',
                }}
              >
                <Image
                  src={player.photo_url}
                  alt={playerFullName(player)}
                  fill
                  sizes="200px"
                  style={{ objectFit: 'cover', objectPosition: 'top center' }}
                  unoptimized
                />
              </div>
            )}
          </div>

          {/* Bio (IT con fallback EN) */}
          {(player.bio_it || player.bio_en) && (() => {
            const bioText = player.bio_it ?? player.bio_en!
            const isEnglish = !player.bio_it
            return (
              <div style={{ marginBottom: 40 }}>
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#7A7870',
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ display: 'inline-block', width: 20, height: 1, background: '#7A7870', opacity: 0.4 }} />
                  Profilo
                  {isEnglish && (
                    <span style={{ fontSize: 9, color: '#C8A85C', fontWeight: 500, letterSpacing: '0.08em', marginLeft: 4 }}>
                      IN ENGLISH
                    </span>
                  )}
                </p>
                {bioText.split('\n\n').filter(Boolean).map((paragraph, i) => (
                  <p
                    key={i}
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 14,
                      lineHeight: 1.75,
                      color: '#1A1A1A',
                      marginBottom: 12,
                    }}
                  >
                    {paragraph}
                  </p>
                ))}
                {player.bio_source && (
                  <p
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 11,
                      color: 'rgba(26,26,26,0.4)',
                      marginTop: 6,
                    }}
                  >
                    Estratto adattato da{' '}
                    <a
                      href={`https://${player.bio_source}/wiki/${encodeURIComponent(`${player.first_name}_${player.last_name}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#534AB7', textDecoration: 'none' }}
                    >
                      Wikipedia
                    </a>
                    {' '}— licenza CC-BY-SA
                  </p>
                )}
              </div>
            )
          })()}

          {/* Link Clerici */}
          {player.clerici_url && (
            <div
              style={{
                padding: '14px 18px',
                background: 'rgba(83,74,183,0.05)',
                border: '1px solid rgba(83,74,183,0.15)',
                borderLeft: '3px solid #534AB7',
                marginBottom: 40,
              }}
            >
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#1A1A1A', marginBottom: 6 }}>
                Gianni Clerici ha scritto di {playerFullName(player)} per oltre trent&#39;anni.
              </p>
              <a
                href={player.clerici_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: '#534AB7', textDecoration: 'none' }}
              >
                Articoli di Clerici su La Repubblica →
              </a>
            </div>
          )}

          <SectionDivider />

          {/* Eco culturale */}
          <CulturalImpactSection items={culturalItems} title="Eco culturale" />

          {/* Partite */}
          <div>
            <h2
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 24,
                color: '#1A1A1A',
                marginBottom: 24,
              }}
            >
              Partite nell&#39;archivio
            </h2>
            {slamWins.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#C8A85C',
                    marginBottom: 12,
                  }}
                >
                  Finali Slam vinte
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                  {slamWins.slice(0, 4).map(m => (
                    <ScoreCard key={m.id} match={m} />
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12, marginTop: 16 }}>
              {matches.slice(0, 20).map((m, i) => (
                <ScoreCard key={m.id} match={m} showNumber={i + 1} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(26,26,26,0.08)',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '12px 16px', borderBottom: '2px solid #1A1A1A' }}>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 9,
                  fontWeight: 500,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#7A7870',
                }}
              >
                Scheda Giocatore
              </p>
            </div>
            <div>
              {[
                { label: 'Nome completo',  value: playerFullName(player) },
                { label: 'Nazionalità',    value: player.country_code ?? '–' },
                { label: 'Data di nascita', value: player.birth_date ? new Date(player.birth_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : '–' },
                { label: 'Altezza',        value: player.height_cm ? `${player.height_cm} cm` : '–' },
                { label: 'Mano',           value: player.hand === 'R' ? 'Destro' : player.hand === 'L' ? 'Mancino' : '–' },
                { label: 'Best rank ATP',  value: player.atp_peak_rank ? `#${player.atp_peak_rank}` : '–' },
                { label: 'Grandi Slam',    value: String(player.grand_slams) },
                { label: 'Attivo',         value: `${player.active_from ?? '?'} – ${player.active_to ?? '?'}` },
                { label: 'Vittorie arch.', value: String(wins.length) },
                { label: 'Sconfitte arch.',value: String(losses.length) },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 16px',
                    borderBottom: '1px solid rgba(26,26,26,0.05)',
                    gap: 8,
                  }}
                >
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#7A7870', flexShrink: 0 }}>
                    {label}
                  </span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: '#1A1A1A', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {player.photo_credit && (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'rgba(26,26,26,0.3)', lineHeight: 1.5 }}>
              Foto: {player.photo_credit}
            </p>
          )}
        </aside>
      </div>
    </div>
  )
}
