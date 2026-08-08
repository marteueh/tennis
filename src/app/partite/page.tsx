import type { Metadata } from 'next'
import Link from 'next/link'
import { ScoreCard } from '@/components/ScoreCard'
import { getMatches } from '@/lib/supabase'
import type { Match } from '@/lib/types'
import { SURFACE_LABELS, ROUND_LABELS } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Partite — Archivio Grandi Slam 1980–2002',
  description: 'Tutte le partite dei Grandi Slam ATP dal 1980 al 2002. Filtra per anno, torneo, superficie e turno.',
}

const YEARS = Array.from({ length: 23 }, (_, i) => 1980 + i)

const TOURNAMENTS = [
  { slug: 'australian-open', label: 'Australian Open' },
  { slug: 'roland-garros',   label: 'Roland Garros' },
  { slug: 'wimbledon',       label: 'Wimbledon' },
  { slug: 'us-open',         label: 'US Open' },
]

const ROUNDS = ['F', 'SF', 'QF', 'R16', 'R32', 'R64', 'R128'] as const

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
  youtube_video_id: null, youtube_channel: null, youtube_verified_at: null, youtube_tommasi_id: null, youtube_tommasi_channel: null, youtube_tommasi_searched_at: null,
  clerici_article_url: null, clerici_excerpt_it: null, editorial_note_it: null,
  clerici_source: null, clerici_article_title: null, clerici_verified_at: null, featured: true, featured_week: '1995-09-10',
}

interface SearchParams { year?: string; surface?: string; torneo?: string; turno?: string; p?: string }

export default async function PartitePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params  = await searchParams
  const year    = params.year    ? parseInt(params.year)    : undefined
  const surface = params.surface ?? undefined
  const torneo  = params.torneo  ?? undefined
  const turno   = params.turno   ?? undefined
  const page    = params.p ? parseInt(params.p) : 1

  let matches: Match[] = []
  let total = 0

  try {
    const result = await getMatches({ year, surface, tournamentSlug: torneo, round: turno, page })
    matches = result.data
    total   = result.count
  } catch {
    matches = [MOCK_MATCH]
    total   = 1
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">

      <div style={{ marginBottom: 40 }}>
        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7C7568', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-block', width: 20, height: 1, background: '#7C7568', opacity: 0.4 }} />
          Archivio
        </p>
        <h1 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 38, lineHeight: 1.1, color: '#1C1A17' }}>
          Partite
        </h1>
        <p style={{ marginTop: 8, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: '#7C7568' }}>
          {total.toLocaleString('it-IT')} partite · Grandi Slam 1980–2002
        </p>
      </div>

      {/* Filtri — form con select */}
      <form
        method="get"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(170px, 100%), 1fr))',
          gap: 12,
          marginBottom: 14,
          padding: '18px 20px',
          background: '#FFFFFF',
          border: '1px solid rgba(28,26,23,0.08)',
          borderRadius: 2,
          alignItems: 'end',
        }}
      >
        <SelectField label="Anno" name="year" value={year ? String(year) : ''}
          options={[{ value: '', label: 'Tutti gli anni' }, ...YEARS.map(y => ({ value: String(y), label: String(y) }))]}
        />
        <SelectField label="Torneo" name="torneo" value={torneo ?? ''}
          options={[{ value: '', label: 'Tutti i tornei' }, ...TOURNAMENTS.map(t => ({ value: t.slug, label: t.label }))]}
        />
        <SelectField label="Turno" name="turno" value={turno ?? ''}
          options={[{ value: '', label: 'Tutti i turni' }, ...ROUNDS.map(r => ({ value: r, label: ROUND_LABELS[r] ?? r }))]}
        />
        <SelectField label="Superficie" name="surface" value={surface ?? ''}
          options={[
            { value: '',       label: 'Tutte le superfici' },
            { value: 'Hard',   label: 'Cemento' },
            { value: 'Clay',   label: 'Terra Rossa' },
            { value: 'Grass',  label: 'Erba' },
            { value: 'Carpet', label: 'Moquette' },
          ]}
        />

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="submit"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
              padding: '9px 18px', background: '#B54A2C', color: '#FFFFFF',
              border: 'none', borderRadius: 2, cursor: 'pointer', flex: 1,
            }}
          >
            Filtra
          </button>
          {(year || torneo || turno || surface) && (
            <Link
              href="/partite"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase',
                padding: '9px 14px', color: '#7C7568', textDecoration: 'none',
                border: '1px solid rgba(28,26,23,0.12)', borderRadius: 2,
                display: 'inline-flex', alignItems: 'center',
              }}
            >
              Pulisci
            </Link>
          )}
        </div>
      </form>

      {/* Riepilogo filtri attivi */}
      {(year || torneo || turno || surface) && (
        <p style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 12, color: '#7C7568', marginBottom: 24,
        }}>
          Filtri attivi:
          {year && <FilterPill label={String(year)} />}
          {torneo && <FilterPill label={TOURNAMENTS.find(t => t.slug === torneo)?.label ?? torneo} />}
          {turno && <FilterPill label={ROUND_LABELS[turno] ?? turno} />}
          {surface && <FilterPill label={SURFACE_LABELS[surface] ?? surface} />}
        </p>
      )}

      {/* Lista partite */}
      {matches.length === 0 ? (
        <p style={{ fontFamily: "'Source Serif 4', serif", fontStyle: 'italic', fontSize: 16, color: '#7C7568', textAlign: 'center', padding: '48px 0' }}>
          Nessuna partita trovata con i filtri selezionati.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: 16 }}>
          {matches.map((match, i) => (
            <ScoreCard key={match.id} match={match} showNumber={(page - 1) * 20 + i + 1} />
          ))}
        </div>
      )}

      {/* Paginazione */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40 }}>
          {page > 1 && (
            <PaginationLink href={buildUrl({ year, surface, torneo, turno, p: page - 1 })} label="← Precedente" />
          )}
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: '#7C7568', padding: '8px 12px' }}>
            Pagina {page} di {totalPages}
          </span>
          {page < totalPages && (
            <PaginationLink href={buildUrl({ year, surface, torneo, turno, p: page + 1 })} label="Successiva →" />
          )}
        </div>
      )}
    </div>
  )
}

function SelectField({ label, name, value, options }: {
  label: string
  name: string
  value: string
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label style={{
        display: 'block', fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: 9, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase',
        color: '#7C7568', marginBottom: 6,
      }}>
        {label}
      </label>
      <select
        name={name}
        defaultValue={value}
        style={{
          width: '100%', fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 13, padding: '8px 10px',
          border: '1px solid rgba(28,26,23,0.15)', borderRadius: 2,
          background: '#FFFFFF', color: '#1C1A17', cursor: 'pointer',
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function FilterPill({ label }: { label: string }) {
  return (
    <span style={{
      display: 'inline-block', marginLeft: 6,
      padding: '2px 8px', borderRadius: 2,
      background: 'rgba(181,74,44,0.1)', color: '#B54A2C',
      fontSize: 11, fontWeight: 500, letterSpacing: '0.04em',
    }}>
      {label}
    </span>
  )
}

function PaginationLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 500, color: '#B54A2C', textDecoration: 'none', padding: '8px 16px', border: '1px solid rgba(181,74,44,0.3)', borderRadius: 2 }}>
      {label}
    </Link>
  )
}

function buildUrl(p: { year?: number; surface?: string; torneo?: string; turno?: string; p?: number }): string {
  const qs = new URLSearchParams()
  if (p.year)    qs.set('year',    String(p.year))
  if (p.surface) qs.set('surface', p.surface)
  if (p.torneo)  qs.set('torneo',  p.torneo)
  if (p.turno)   qs.set('turno',   p.turno)
  if (p.p && p.p > 1) qs.set('p', String(p.p))
  const str = qs.toString()
  return `/partite${str ? `?${str}` : ''}`
}
