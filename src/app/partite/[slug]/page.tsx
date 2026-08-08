import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MatchVideo } from '@/components/MatchVideo'
import { ClericiVoice } from '@/components/ClericiVoice'
import { CulturalImpactSection } from '@/components/CulturalImpactCard'
import { StatsBlock } from '@/components/StatBar'
import { SectionDivider } from '@/components/SectionDivider'
import { Comments } from '@/components/Comments'
import { auth } from '@/auth'
import {
  getMatchBySlug, getCulturalImpactsForMatch,
  getApprovedCommentsForMatch, getUserPendingCommentForMatch,
} from '@/lib/supabase'
import type { CulturalImpact, Comment } from '@/lib/types'
import { ROUND_LABELS, SURFACE_LABELS } from '@/lib/types'
import { formatScore, formatDuration, playerFullName } from '@/lib/utils'
import type { Match } from '@/lib/types'

// Mock match per sviluppo
const MOCK_MATCH: Match = {
  id: 1, sackmann_id: null, slug: 'pete-sampras-vs-andre-agassi-us-open-1995-f',
  tournament_id: 1, year: 1995, match_date: '1995-09-10', round: 'F',
  surface: 'Hard', winner_id: 1, loser_id: 2,
  winner_rank: 1, loser_rank: 2, score: '6-4 6-3 4-6 7-5', duration_min: 183,
  tournament: { id: 1, slug: 'us-open', name: 'US Open', name_it: 'US Open', surface: 'Hard', category: 'GrandSlam', country_code: 'USA', city: 'New York' },
  winner: { id: 1, sackmann_id: null, slug: 'pete-sampras', first_name: 'Pete', last_name: 'Sampras', country_code: 'USA', hand: 'R', birth_date: null, height_cm: 185, atp_peak_rank: 1, grand_slams: 14, active_from: 1988, active_to: 2002, bio_it: null, bio_en: null, bio_source: null, clerici_url: null, photo_url: null, photo_credit: null },
  loser:  { id: 2, sackmann_id: null, slug: 'andre-agassi', first_name: 'Andre', last_name: 'Agassi', country_code: 'USA', hand: 'R', birth_date: null, height_cm: 180, atp_peak_rank: 1, grand_slams: 8, active_from: 1986, active_to: 2006, bio_it: null, bio_en: null, bio_source: null, clerici_url: null, photo_url: null, photo_credit: null },
  w_ace: 12, w_df: 2, w_svpt: 98, w_1stIn: 68, w_1stWon: 54, w_2ndWon: 18, w_SvGms: 17, w_bpSaved: 4, w_bpFaced: 6,
  l_ace: 4,  l_df: 4, l_svpt: 92, l_1stIn: 58, l_1stWon: 40, l_2ndWon: 14, l_SvGms: 16, l_bpSaved: 3, l_bpFaced: 8,
  youtube_video_id: 'wTNvz2F682k',
  youtube_channel: 'USTA',
  youtube_verified_at: null,
  youtube_tommasi_id: null,
  youtube_tommasi_channel: null,
  youtube_tommasi_searched_at: null,
  clerici_article_url: 'https://ricerca.repubblica.it',
  clerici_excerpt_it: 'Sampras servì come un dio e vinse come un sovrano. Non c\'era molto da fare per Agassi se non alzarsi all\'altezza di un momento che appartiene alla storia del tennis.',
  clerici_source: 'La Repubblica, 11 settembre 1995',
  clerici_article_title: null,
  clerici_verified_at: null,
  editorial_note_it: 'La finale più attesa degli anni \'90. Sampras conquistò il quinto slam in carriera.',
  featured: true,
  featured_week: '1995-09-10',
}

async function getMatch(slug: string): Promise<Match | null> {
  try {
    const match = await getMatchBySlug(slug)
    if (match) return match
    if (slug === MOCK_MATCH.slug) return MOCK_MATCH
    return null
  } catch {
    if (slug === MOCK_MATCH.slug) return MOCK_MATCH
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const match = await getMatch(slug)
  if (!match) return {}

  const winner = match.winner ? playerFullName(match.winner) : 'N/D'
  const loser  = match.loser  ? playerFullName(match.loser)  : 'N/D'
  const tourn  = match.tournament?.name ?? ''
  const title  = `${winner} b. ${loser} ${match.score} | ${ROUND_LABELS[match.round] ?? match.round} ${tourn} ${match.year}`

  const ogParams = new URLSearchParams({
    type:   'match',
    winner,
    loser,
    score:  match.score ?? '',
    tourn,
    year:   String(match.year),
    round:  ROUND_LABELS[match.round] ?? match.round,
  })

  return {
    title,
    description: `Statistiche complete, video e la cronaca di Gianni Clerici del ${ROUND_LABELS[match.round] ?? match.round} ${tourn} ${match.year} tra ${winner} e ${loser}.`,
    openGraph: {
      title,
      type: 'article',
      images: [{ url: `/api/og?${ogParams}`, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      images: [`/api/og?${ogParams}`],
    },
  }
}

export default async function PartitaPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const match = await getMatch(slug)
  if (!match) notFound()

  let culturalItems: CulturalImpact[] = []
  try {
    culturalItems = await getCulturalImpactsForMatch(match.id)
  } catch { /* DB non disponibile */ }

  let comments: Comment[] = []
  let userHasPending = false
  try {
    comments = await getApprovedCommentsForMatch(match.id)
    const session = await auth()
    if (session?.user?.id) {
      const userId = parseInt(session.user.id, 10)
      if (!isNaN(userId)) {
        const pending = await getUserPendingCommentForMatch(userId, match.id)
        userHasPending = !!pending
      }
    }
  } catch { /* DB non disponibile */ }

  const winner  = match.winner
  const loser   = match.loser
  const tourn   = match.tournament
  const sets    = formatScore(match.score)

  const matchTitle  = `${winner ? playerFullName(winner) : 'N/D'} b. ${loser ? playerFullName(loser) : 'N/D'}`
  const tournLabel  = tourn?.name_it ?? tourn?.name ?? ''

  return (
    <article className="max-w-7xl mx-auto px-6 py-12">

      {/* Breadcrumb */}
      <nav style={{ marginBottom: 32, display: 'flex', gap: 8, alignItems: 'center' }}>
        <Link href="/partite" style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: 'var(--muted)', textDecoration: 'none' }}>
          Partite
        </Link>
        <span style={{ color: 'rgba(var(--ink-rgb),0.2)', fontSize: 12 }}>›</span>
        {tourn && (
          <>
            <Link href={`/tornei/${tourn.slug}`} style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: 'var(--muted)', textDecoration: 'none' }}>
              {tournLabel}
            </Link>
            <span style={{ color: 'rgba(var(--ink-rgb),0.2)', fontSize: 12 }}>›</span>
          </>
        )}
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: 'var(--ink)' }}>
          {match.year}
        </span>
      </nav>

      <div
        style={{ gap: 40, alignItems: 'start' }}
        className="grid grid-cols-1 lg:grid-cols-[1fr_320px]"
      >
        {/* ── Colonna principale ── */}
        <div>
          {/* Meta tag */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {tourn && (
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)' }}>
                {tournLabel}
              </span>
            )}
            <span style={{ color: 'rgba(var(--ink-rgb),0.2)', fontSize: 10 }}>·</span>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              {match.year}
            </span>
            <span style={{ color: 'rgba(var(--ink-rgb),0.2)', fontSize: 10 }}>·</span>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)' }}>
              {ROUND_LABELS[match.round] ?? match.round}
            </span>
            {match.surface && (
              <>
                <span style={{ color: 'rgba(var(--ink-rgb),0.2)', fontSize: 10 }}>·</span>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                  {SURFACE_LABELS[match.surface] ?? match.surface}
                </span>
              </>
            )}
          </div>

          {/* Score hero */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(var(--ink-rgb),0.08)',
              borderRadius: 2,
              padding: '32px',
              marginBottom: 32,
            }}
          >
            {/* Winner */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                padding: '12px 16px',
                background: 'rgba(var(--accent-rgb),0.08)',
                borderRadius: 2,
                marginBottom: 8,
              }}
            >
              <div>
                {winner ? (
                  <Link
                    href={`/giocatori/${winner.slug}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: 24,
                        fontWeight: 600,
                        color: 'var(--accent)',
                        lineHeight: 1.1,
                        display: 'block',
                      }}
                    >
                      {playerFullName(winner)}
                    </span>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: 'var(--muted)', letterSpacing: '0.04em' }}>
                      {winner.country_code} · Rank #{match.winner_rank ?? '–'}
                    </span>
                  </Link>
                ) : (
                  <span style={{ fontFamily: "var(--font-serif)", fontSize: 24, fontWeight: 600, color: 'var(--accent)' }}>N/D</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                {sets.map((s, i) => {
                  const tb = s.match(/\((\d+)\)/)
                  const clean = s.replace(/\(\d+\)/, '')
                  const parts = clean.split('-')
                  const w = parseInt(parts[0], 10)
                  const l = parseInt(parts[1] ?? '', 10)
                  const wonSet = w > l
                  return (
                    <span
                      key={i}
                      style={{
                        display: 'inline-block',
                        width: 36,
                        textAlign: 'center',
                        fontFamily: "'Bebas Neue', Impact, sans-serif",
                        fontSize: 34,
                        color: wonSet ? 'var(--ink)' : 'rgba(var(--ink-rgb),0.3)',
                        lineHeight: 1,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {isNaN(w) ? '' : w}
                    </span>
                  )
                })}
              </div>
            </div>

            {/* Loser */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                padding: '8px 16px',
              }}
            >
              <div>
                {loser ? (
                  <Link href={`/giocatori/${loser.slug}`} style={{ textDecoration: 'none' }}>
                    <span
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: 20,
                        fontWeight: 400,
                        color: 'rgba(var(--ink-rgb),0.45)',
                        lineHeight: 1.1,
                        display: 'block',
                      }}
                    >
                      {playerFullName(loser)}
                    </span>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: 'rgba(var(--ink-rgb),0.3)', letterSpacing: '0.04em' }}>
                      {loser.country_code} · Rank #{match.loser_rank ?? '–'}
                    </span>
                  </Link>
                ) : (
                  <span style={{ fontFamily: "var(--font-serif)", fontSize: 20, color: 'rgba(var(--ink-rgb),0.45)' }}>N/D</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                {sets.map((s, i) => {
                  const tbMatch = s.match(/\((\d+)\)/)
                  const tb = tbMatch ? parseInt(tbMatch[1], 10) : null
                  const clean = s.replace(/\(\d+\)/, '')
                  const parts = clean.split('-')
                  const w = parseInt(parts[0], 10)
                  const l = parseInt(parts[1] ?? '0', 10)
                  const wonSet = l > w
                  return (
                    <span
                      key={i}
                      style={{
                        display: 'inline-block',
                        width: 36,
                        textAlign: 'center',
                        position: 'relative',
                        fontFamily: "'Bebas Neue', Impact, sans-serif",
                        fontSize: 34,
                        color: wonSet ? 'rgba(var(--ink-rgb),0.55)' : 'rgba(var(--ink-rgb),0.2)',
                        lineHeight: 1,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {l}
                      {tb !== null && (
                        <sup style={{
                          position: 'absolute',
                          top: -2,
                          right: -11,
                          fontSize: 10,
                          fontFamily: "var(--font-sans)",
                          color: 'rgba(var(--ink-rgb),0.35)',
                          fontWeight: 400,
                        }}>
                          {tb}
                        </sup>
                      )}
                    </span>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Video */}
          {(match.youtube_video_id || match.youtube_tommasi_id) && (
            <div style={{ marginBottom: 32 }}>
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
                Video
              </p>
              <MatchVideo
                videoId={match.youtube_video_id}
                tommasiVideoId={match.youtube_tommasi_id}
                tommasiChannel={match.youtube_tommasi_channel}
                title={matchTitle}
                tournament={tournLabel}
                year={match.year}
              />
            </div>
          )}

          {/* Statistiche */}
          {(match.w_svpt != null || match.l_svpt != null) && (
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid rgba(var(--ink-rgb),0.08)',
                borderRadius: 2,
                padding: '28px',
                marginBottom: 32,
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span style={{ display: 'inline-block', width: 20, height: 1, background: 'var(--muted)', opacity: 0.4 }} />
                Statistiche
              </p>
              <StatsBlock
                winnerName={winner ? playerFullName(winner) : 'Vincitore'}
                loserName={loser  ? playerFullName(loser)  : 'Perdente'}
                wAce={match.w_ace}     lAce={match.l_ace}
                wDf={match.w_df}       lDf={match.l_df}
                w1stIn={match.w_1stIn} l1stIn={match.l_1stIn}
                w1stWon={match.w_1stWon} l1stWon={match.l_1stWon}
                wSvpt={match.w_svpt}   lSvpt={match.l_svpt}
                w2ndWon={match.w_2ndWon} l2ndWon={match.l_2ndWon}
                wBpSaved={match.w_bpSaved} lBpSaved={match.l_bpSaved}
                wBpFaced={match.w_bpFaced} lBpFaced={match.l_bpFaced}
              />
            </div>
          )}

          {/* La Voce Narrante — solo se estratto inserito o articolo verificato */}
          {(match.clerici_excerpt_it || match.clerici_source === 'repubblica_verified') && (
            <div style={{ marginBottom: 32 }}>
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
                La voce narrante
              </p>
              <ClericiVoice
                excerpt={match.clerici_excerpt_it}
                articleUrl={match.clerici_article_url}
                articleTitle={match.clerici_article_title}
                source={match.clerici_source}
                matchSlug={match.slug}
                matchTitle={matchTitle}
              />
            </div>
          )}

          {/* Eco culturale */}
          <CulturalImpactSection items={culturalItems} />

          {/* Nota editoriale */}
          {match.editorial_note_it && (
            <div
              style={{
                padding: '16px 20px',
                background: 'rgba(var(--gold-rgb),0.07)',
                border: '1px solid rgba(var(--gold-rgb),0.2)',
                borderRadius: 2,
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-serif)",
                  fontStyle: 'italic',
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: 'var(--ink)',
                }}
              >
                {match.editorial_note_it}
              </p>
            </div>
          )}
        </div>

        {/* ── Sidebar info ── */}
        <aside>
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
                Info Partita
              </p>
            </div>
            <div style={{ padding: '4px 0' }}>
              {[
                { label: 'Torneo',     value: tournLabel },
                { label: 'Anno',       value: String(match.year) },
                { label: 'Turno',      value: ROUND_LABELS[match.round] ?? match.round },
                { label: 'Superficie', value: match.surface ? (SURFACE_LABELS[match.surface] ?? match.surface) : '–' },
                { label: 'Data',       value: match.match_date ? new Date(match.match_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : '–' },
                { label: 'Durata',     value: formatDuration(match.duration_min) },
                { label: 'Score',      value: match.score },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 16px',
                    borderBottom: '1px solid rgba(var(--ink-rgb),0.05)',
                    gap: 12,
                  }}
                >
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: 'var(--muted)', flexShrink: 0 }}>
                    {label}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 12,
                      fontWeight: 500,
                      color: 'var(--ink)',
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Link giocatori */}
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {winner && (
              <Link
                href={`/giocatori/${winner.slug}`}
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--accent)',
                  textDecoration: 'none',
                  padding: '10px 14px',
                  border: '1px solid rgba(var(--accent-rgb),0.25)',
                  borderRadius: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>Profilo {playerFullName(winner)}</span>
                <span>→</span>
              </Link>
            )}
            {loser && (
              <Link
                href={`/giocatori/${loser.slug}`}
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--muted)',
                  textDecoration: 'none',
                  padding: '10px 14px',
                  border: '1px solid rgba(var(--ink-rgb),0.1)',
                  borderRadius: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>Profilo {playerFullName(loser)}</span>
                <span>→</span>
              </Link>
            )}
          </div>
        </aside>
      </div>

      <SectionDivider />

      {/* Commenti */}
      <section style={{ maxWidth: 760, margin: '0 auto 48px' }}>
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 10, fontWeight: 500, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'var(--muted)',
            marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <span style={{ display: 'inline-block', width: 20, height: 1, background: 'var(--muted)', opacity: 0.4 }} />
          Conversazione
          {comments.length > 0 && (
            <span style={{ color: 'rgba(var(--ink-rgb),0.4)', fontSize: 10 }}>
              · {comments.length} commento{comments.length === 1 ? '' : 'i'}
            </span>
          )}
        </p>
        <Comments
          matchSlug={match.slug}
          matchTitle={matchTitle}
          initialComments={comments}
          hasPendingFromUser={userHasPending}
        />
      </section>

      <SectionDivider />

      {/* Attribuzione dati */}
      <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: 'rgba(var(--ink-rgb),0.3)', textAlign: 'center' }}>
        Dati statistici: Jeff Sackmann / Tennis Abstract (CC-BY-NC-SA 4.0) ·{' '}
        <a href="https://github.com/JeffSackmann/tennis_atp" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(var(--ink-rgb),0.45)' }}>
          github.com/JeffSackmann/tennis_atp
        </a>
      </p>
    </article>
  )
}
