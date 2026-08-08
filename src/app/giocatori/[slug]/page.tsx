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

// La prima "pagina" dell'archivio partite mostra 12 risultati, le successive 16
const FIRST_PAGE_SIZE = 12
const NEXT_PAGE_SIZE = 16

function matchesPageSlice(page: number): { start: number; end: number } {
  if (page <= 1) return { start: 0, end: FIRST_PAGE_SIZE }
  const start = FIRST_PAGE_SIZE + (page - 2) * NEXT_PAGE_SIZE
  return { start, end: start + NEXT_PAGE_SIZE }
}

function matchesTotalPages(total: number): number {
  if (total <= FIRST_PAGE_SIZE) return 1
  return 1 + Math.ceil((total - FIRST_PAGE_SIZE) / NEXT_PAGE_SIZE)
}

export default async function GiocatorePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ p?: string }>
}) {
  const { slug } = await params
  const { p: pageRaw } = await searchParams
  const data = await getData(slug)
  if (!data) notFound()

  let culturalItems: CulturalImpact[] = []
  try {
    culturalItems = await getCulturalImpactsForPlayer(data.player.id)
  } catch { /* DB non disponibile */ }

  const { player, matches } = data
  const wins   = matches.filter(m => m.winner_id === player.id)
  const losses = matches.filter(m => m.loser_id  === player.id)

  const totalPages = matchesTotalPages(matches.length)
  const page = Math.min(totalPages, Math.max(1, parseInt(pageRaw ?? '1', 10) || 1))
  const { start, end } = matchesPageSlice(page)
  const pageMatches = matches.slice(start, end)

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">

      {/* Breadcrumb */}
      <nav style={{ marginBottom: 32, display: 'flex', gap: 8, alignItems: 'center' }}>
        <Link href="/giocatori" style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: 'var(--muted)', textDecoration: 'none' }}>
          Giocatori
        </Link>
        <span style={{ color: 'rgba(var(--ink-rgb),0.2)', fontSize: 12 }}>›</span>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: 'var(--ink)' }}>
          {playerFullName(player)}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px]" style={{ gap: 40, alignItems: 'start' }}>

        {/* ── Colonna principale ── */}
        <div>
          {/* Hero giocatore */}
          <div
            style={{
              borderBottom: '2px solid var(--ink)',
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
                  fontFamily: "var(--font-sans)",
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--gold)',
                  marginBottom: 10,
                }}
              >
                {player.country_code} · {player.active_from}–{player.active_to}
              </p>
              <h1
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 'clamp(36px, 5vw, 64px)',
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  color: 'var(--ink)',
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
                        fontFamily: "'Bebas Neue', Impact, sans-serif",
                        fontSize: 36,
                        color: gold ? 'var(--gold)' : 'var(--ink)',
                        lineHeight: 1,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {num ?? '–'}
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: 9,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'var(--muted)',
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
                  borderBottom: '3px solid var(--gold)',
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
                    fontFamily: "var(--font-sans)",
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--muted)',
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ display: 'inline-block', width: 20, height: 1, background: 'var(--muted)', opacity: 0.4 }} />
                  Profilo
                  {isEnglish && (
                    <span style={{ fontSize: 9, color: 'var(--gold)', fontWeight: 500, letterSpacing: '0.08em', marginLeft: 4 }}>
                      IN ENGLISH
                    </span>
                  )}
                </p>
                {bioText.split('\n\n').filter(Boolean).map((paragraph, i) => (
                  <p
                    key={i}
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 14,
                      lineHeight: 1.75,
                      color: 'var(--ink)',
                      marginBottom: 12,
                    }}
                  >
                    {paragraph}
                  </p>
                ))}
                {player.bio_source && (
                  <p
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 11,
                      color: 'rgba(var(--ink-rgb),0.4)',
                      marginTop: 6,
                    }}
                  >
                    Estratto adattato da{' '}
                    <a
                      href={`https://${player.bio_source}/wiki/${encodeURIComponent(`${player.first_name}_${player.last_name}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--accent)', textDecoration: 'none' }}
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
                background: 'rgba(var(--accent-rgb),0.05)',
                border: '1px solid rgba(var(--accent-rgb),0.15)',
                borderLeft: '3px solid var(--accent)',
                marginBottom: 40,
              }}
            >
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: 'var(--ink)', marginBottom: 6 }}>
                Gianni Clerici ha scritto di {playerFullName(player)} per oltre trent&#39;anni.
              </p>
              <a
                href={player.clerici_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 500, color: 'var(--accent)', textDecoration: 'none' }}
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
                fontFamily: "var(--font-serif)",
                fontSize: 24,
                color: 'var(--ink)',
                marginBottom: 24,
              }}
            >
              Partite nell&#39;archivio
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: 12 }}>
              {pageMatches.map((m, i) => (
                <ScoreCard key={m.id} match={m} showNumber={start + i + 1} />
              ))}
            </div>
            {totalPages > 1 && (
              <MatchesPagination slug={slug} currentPage={page} totalPages={totalPages} />
            )}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(var(--ink-rgb),0.08)',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '12px 16px', borderBottom: '2px solid var(--ink)' }}>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 9,
                  fontWeight: 500,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
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
                    borderBottom: '1px solid rgba(var(--ink-rgb),0.05)',
                    gap: 8,
                  }}
                >
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: 'var(--muted)', flexShrink: 0 }}>
                    {label}
                  </span>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 500, color: 'var(--ink)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {player.photo_credit && (
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, color: 'rgba(var(--ink-rgb),0.3)', lineHeight: 1.5 }}>
              Foto: {player.photo_credit}
            </p>
          )}
        </aside>
      </div>
    </div>
  )
}

function MatchesPagination({ slug, currentPage, totalPages }: { slug: string; currentPage: number; totalPages: number }) {
  function pageUrl(p: number) {
    return p > 1 ? `/giocatori/${slug}?p=${p}` : `/giocatori/${slug}`
  }

  const pages: (number | '…')[] = []
  const range = 2
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || (p >= currentPage - range && p <= currentPage + range)) {
      pages.push(p)
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…')
    }
  }

  return (
    <nav
      aria-label="Paginazione partite"
      style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, marginTop: 32, fontFamily: "var(--font-sans)" }}
    >
      {currentPage > 1 && (
        <Link href={pageUrl(currentPage - 1)} scroll={false} style={pageBtnStyle()}>← Prec</Link>
      )}
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} style={{ padding: '6px 4px', color: 'rgba(var(--ink-rgb),0.3)', fontSize: 13 }}>…</span>
        ) : (
          <Link
            key={p}
            href={pageUrl(p)}
            scroll={false}
            aria-current={p === currentPage ? 'page' : undefined}
            style={pageBtnStyle(p === currentPage)}
          >
            {p}
          </Link>
        ),
      )}
      {currentPage < totalPages && (
        <Link href={pageUrl(currentPage + 1)} scroll={false} style={pageBtnStyle()}>Succ →</Link>
      )}
    </nav>
  )
}

function pageBtnStyle(active = false): React.CSSProperties {
  return {
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: '0.04em',
    padding: '6px 11px',
    border: '1px solid',
    borderColor: active ? 'var(--accent)' : 'rgba(var(--ink-rgb),0.12)',
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? '#FFFFFF' : 'var(--ink)',
    textDecoration: 'none',
    borderRadius: 2,
    fontVariantNumeric: 'tabular-nums',
    minWidth: 30,
    textAlign: 'center',
  }
}
