import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getPlayersPaginated } from '@/lib/supabase'
import type { Player } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Giocatori — Career stats 1980–2002',
  description: 'Profili e statistiche di carriera dei protagonisti del tennis 1980–2002.',
}

const MOCK_PLAYERS: Player[] = [
  { id: 1, sackmann_id: null, slug: 'pete-sampras',    first_name: 'Pete',    last_name: 'Sampras',    country_code: 'USA', hand: 'R', birth_date: '1971-08-12', height_cm: 185, atp_peak_rank: 1, grand_slams: 14, active_from: 1988, active_to: 2002, bio_it: null, bio_en: null, bio_source: null, clerici_url: null, photo_url: null, photo_credit: null },
  { id: 2, sackmann_id: null, slug: 'andre-agassi',    first_name: 'Andre',   last_name: 'Agassi',     country_code: 'USA', hand: 'R', birth_date: '1970-04-29', height_cm: 180, atp_peak_rank: 1, grand_slams: 8,  active_from: 1986, active_to: 2006, bio_it: null, bio_en: null, bio_source: null, clerici_url: null, photo_url: null, photo_credit: null },
  { id: 3, sackmann_id: null, slug: 'jim-courier',     first_name: 'Jim',     last_name: 'Courier',    country_code: 'USA', hand: 'R', birth_date: '1970-08-17', height_cm: 185, atp_peak_rank: 1, grand_slams: 4,  active_from: 1988, active_to: 2000, bio_it: null, bio_en: null, bio_source: null, clerici_url: null, photo_url: null, photo_credit: null },
  { id: 4, sackmann_id: null, slug: 'stefan-edberg',   first_name: 'Stefan',  last_name: 'Edberg',     country_code: 'SWE', hand: 'R', birth_date: '1966-01-19', height_cm: 188, atp_peak_rank: 1, grand_slams: 6,  active_from: 1983, active_to: 1996, bio_it: null, bio_en: null, bio_source: null, clerici_url: null, photo_url: null, photo_credit: null },
  { id: 5, sackmann_id: null, slug: 'boris-becker',    first_name: 'Boris',   last_name: 'Becker',     country_code: 'GER', hand: 'R', birth_date: '1967-11-22', height_cm: 190, atp_peak_rank: 1, grand_slams: 6,  active_from: 1984, active_to: 1999, bio_it: null, bio_en: null, bio_source: null, clerici_url: null, photo_url: null, photo_credit: null },
  { id: 6, sackmann_id: null, slug: 'michael-chang',   first_name: 'Michael', last_name: 'Chang',      country_code: 'USA', hand: 'R', birth_date: '1972-02-22', height_cm: 175, atp_peak_rank: 2, grand_slams: 1,  active_from: 1988, active_to: 2003, bio_it: null, bio_en: null, bio_source: null, clerici_url: null, photo_url: null, photo_credit: null },
  { id: 7, sackmann_id: null, slug: 'ivan-lendl',      first_name: 'Ivan',    last_name: 'Lendl',      country_code: 'CZE', hand: 'R', birth_date: '1960-03-07', height_cm: 188, atp_peak_rank: 1, grand_slams: 8,  active_from: 1978, active_to: 1994, bio_it: null, bio_en: null, bio_source: null, clerici_url: null, photo_url: null, photo_credit: null },
  { id: 8, sackmann_id: null, slug: 'goran-ivanisevic', first_name: 'Goran', last_name: 'Ivanisevic',  country_code: 'CRO', hand: 'L', birth_date: '1971-09-13', height_cm: 193, atp_peak_rank: 2, grand_slams: 1,  active_from: 1988, active_to: 2004, bio_it: null, bio_en: null, bio_source: null, clerici_url: null, photo_url: null, photo_credit: null },
]

const PAGE_SIZE = 60

interface PageData {
  data: Player[]
  total: number
  page: number
  totalPages: number
}

async function getPlayerPage(search: string | undefined, page: number): Promise<PageData> {
  try {
    const res = await getPlayersPaginated({ search, page, pageSize: PAGE_SIZE })
    if (res.data.length === 0 && !search) {
      return { data: MOCK_PLAYERS, total: MOCK_PLAYERS.length, page: 1, totalPages: 1 }
    }
    return { data: res.data, total: res.total, page: res.page, totalPages: res.totalPages }
  } catch {
    return { data: search ? [] : MOCK_PLAYERS, total: search ? 0 : MOCK_PLAYERS.length, page: 1, totalPages: 1 }
  }
}

export default async function GiocatoriPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { q, page: pageRaw } = await searchParams
  const page = Math.max(1, parseInt(pageRaw ?? '1', 10) || 1)
  const { data: players, total, totalPages } = await getPlayerPage(q, page)

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div style={{ marginBottom: 40 }}>
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ display: 'inline-block', width: 20, height: 1, background: 'var(--muted)', opacity: 0.4 }} />
          Archivio
        </p>
        <h1
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 38,
            lineHeight: 1.1,
            color: 'var(--ink)',
          }}
        >
          Giocatori
        </h1>
        <p style={{ marginTop: 8, fontFamily: "var(--font-sans)", fontSize: 14, color: 'var(--muted)' }}>
          {q
            ? <>{total} risultat{total === 1 ? 'o' : 'i'} per <em style={{ color: 'var(--ink)' }}>&ldquo;{q}&rdquo;</em></>
            : <>I protagonisti del tennis 1980–2002 · {total.toLocaleString('it-IT')} giocatori in archivio</>
          }
        </p>

        {/* Form ricerca */}
        <form method="get" style={{ marginTop: 18 }}>
          <input
            type="text"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Cerca per nome o cognome…"
            style={{
              width: '100%', maxWidth: 360, fontSize: 13, padding: '9px 12px',
              border: '1px solid rgba(var(--ink-rgb),0.18)', borderRadius: 2,
              color: 'var(--ink)', fontFamily: "var(--font-sans)",
            }}
          />
        </form>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
          gap: 12,
        }}
      >
        {players.map((player) => (
          <Link
            key={player.id}
            href={`/giocatori/${player.slug}`}
            style={{ textDecoration: 'none' }}
          >
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid rgba(var(--ink-rgb),0.08)',
                borderRadius: 2,
                overflow: 'hidden',
              }}
              className="hover:border-accent/25 lift-on-hover"
            >
              {/* Foto + header */}
              <div style={{ display: 'flex', gap: 0 }}>
                {/* Foto o monogramma */}
                <div
                  style={{
                    width: 72,
                    flexShrink: 0,
                    position: 'relative',
                    background: player.photo_url ? 'transparent' : 'rgba(var(--ink-rgb),0.04)',
                    borderRight: '1px solid rgba(var(--ink-rgb),0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 88,
                  }}
                >
                  {player.photo_url ? (
                    <Image
                      src={player.photo_url}
                      alt={`${player.first_name} ${player.last_name}`}
                      fill
                      sizes="72px"
                      style={{ objectFit: 'cover', objectPosition: 'top center' }}
                      unoptimized
                    />
                  ) : (
                    <span
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: 20,
                        fontWeight: 600,
                        color: 'rgba(var(--ink-rgb),0.18)',
                        letterSpacing: '0.04em',
                        userSelect: 'none',
                      }}
                    >
                      {player.first_name[0]}{player.last_name[0]}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: '14px 16px', flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p
                        style={{
                          fontFamily: "var(--font-serif)",
                          fontSize: 17,
                          fontWeight: 600,
                          color: 'var(--ink)',
                          lineHeight: 1.1,
                          marginBottom: 3,
                        }}
                      >
                        {player.first_name} {player.last_name}
                      </p>
                      <p
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: 11,
                          color: 'var(--muted)',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {player.country_code ?? ''} · {player.active_from ?? ''}–{player.active_to ?? ''}
                      </p>
                    </div>
                    {player.atp_peak_rank === 1 && (
                      <span
                        style={{
                          fontFamily: "'Bebas Neue', Impact, sans-serif",
                          fontSize: 13,
                          letterSpacing: '0.1em',
                          color: 'var(--gold)',
                          background: 'rgba(var(--gold-rgb),0.1)',
                          padding: '2px 7px',
                          borderRadius: 2,
                          flexShrink: 0,
                        }}
                      >
                        #1
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 14,
                      marginTop: 10,
                      paddingTop: 10,
                      borderTop: '1px solid rgba(var(--ink-rgb),0.06)',
                    }}
                  >
                    {player.grand_slams > 0 && (
                      <div>
                        <p style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 22, color: 'var(--gold)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                          {player.grand_slams}
                        </p>
                        <p style={{ fontFamily: "var(--font-sans)", fontSize: 9, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Slam</p>
                      </div>
                    )}
                    {player.atp_peak_rank && (
                      <div>
                        <p style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 22, color: 'var(--accent)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                          #{player.atp_peak_rank}
                        </p>
                        <p style={{ fontFamily: "var(--font-sans)", fontSize: 9, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Best rank</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Paginazione */}
      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} search={q} />
      )}
    </div>
  )
}

function Pagination({ currentPage, totalPages, search }: { currentPage: number; totalPages: number; search?: string }) {
  function pageUrl(p: number) {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return qs ? `/giocatori?${qs}` : '/giocatori'
  }

  // Costruisci elenco pagine con ellipsi
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
      aria-label="Paginazione"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
        marginTop: 40,
        fontFamily: "var(--font-sans)",
      }}
    >
      {currentPage > 1 && (
        <Link href={pageUrl(currentPage - 1)} style={pageBtnStyle()}>← Prec</Link>
      )}
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} style={{ padding: '6px 4px', color: 'rgba(var(--ink-rgb),0.3)', fontSize: 13 }}>…</span>
        ) : (
          <Link
            key={p}
            href={pageUrl(p)}
            aria-current={p === currentPage ? 'page' : undefined}
            style={pageBtnStyle(p === currentPage)}
          >
            {p}
          </Link>
        ),
      )}
      {currentPage < totalPages && (
        <Link href={pageUrl(currentPage + 1)} style={pageBtnStyle()}>Succ →</Link>
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
