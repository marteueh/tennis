import type { Metadata } from 'next'
import Link from 'next/link'
import { ScoreCard } from '@/components/ScoreCard'
import { SectionDivider } from '@/components/SectionDivider'
import { NewsletterForm } from '@/components/NewsletterForm'
import { HeroDuoCarousel } from '@/components/HeroDuoCarousel'
import { getFeaturedMatches } from '@/lib/supabase'
import type { Match } from '@/lib/types'

export const metadata: Metadata = {
  title: "Ace Chronicle — Tennis 1980-2002: statistiche, video e narrazione",
  description:
    "Archivio completo del tennis 1980-2002. Statistiche, video storici e la voce di Gianni Clerici su ogni partita.",
}

// Mock data per fase di sviluppo (sostituito da Supabase in produzione)
const MOCK_FEATURED: Match[] = [
  {
    id: 1, sackmann_id: null, slug: 'pete-sampras-vs-andre-agassi-us-open-1995-f',
    tournament_id: 1, year: 1995, match_date: '1995-09-10', round: 'F',
    surface: 'Hard', winner_id: 1, loser_id: 2,
    winner_rank: 1, loser_rank: 2, score: '6-4 6-3 4-6 7-5',
    duration_min: 183,
    tournament: { id: 1, slug: 'us-open', name: 'US Open', name_it: 'US Open', surface: 'Hard', category: 'GrandSlam', country_code: 'USA', city: 'New York' },
    winner: { id: 1, sackmann_id: null, slug: 'pete-sampras', first_name: 'Pete', last_name: 'Sampras', country_code: 'USA', hand: 'R', birth_date: null, height_cm: 185, atp_peak_rank: 1, grand_slams: 14, active_from: 1988, active_to: 2002, bio_it: null, bio_en: null, bio_source: null, clerici_url: null, photo_url: null, photo_credit: null },
    loser:  { id: 2, sackmann_id: null, slug: 'andre-agassi',  first_name: 'Andre', last_name: 'Agassi',  country_code: 'USA', hand: 'R', birth_date: null, height_cm: 180, atp_peak_rank: 1, grand_slams: 8,  active_from: 1986, active_to: 2006, bio_it: null, bio_en: null, bio_source: null, clerici_url: null, photo_url: null, photo_credit: null },
    w_ace: 12, w_df: 2, w_svpt: 98, w_1stIn: 68, w_1stWon: 54, w_2ndWon: 18, w_SvGms: 17, w_bpSaved: 4, w_bpFaced: 6,
    l_ace: 4,  l_df: 4, l_svpt: 92, l_1stIn: 58, l_1stWon: 40, l_2ndWon: 14, l_SvGms: 16, l_bpSaved: 3, l_bpFaced: 8,
    youtube_video_id: null, youtube_channel: 'USTA', youtube_verified_at: null, youtube_tommasi_id: null, youtube_tommasi_channel: null, youtube_tommasi_searched_at: null,
    clerici_article_url: null, clerici_excerpt_it: null, editorial_note_it: null,
    clerici_source: null, clerici_article_title: null, clerici_verified_at: null, featured: true, featured_week: '1995-09-10',
  },
  {
    id: 2, sackmann_id: null, slug: 'andre-agassi-vs-pete-sampras-australian-open-1995-f',
    tournament_id: 2, year: 1995, match_date: '1995-01-29', round: 'F',
    surface: 'Hard', winner_id: 2, loser_id: 3,
    winner_rank: 1, loser_rank: 2, score: '4-6 6-1 7-6 6-4',
    duration_min: 178,
    tournament: { id: 2, slug: 'australian-open', name: 'Australian Open', name_it: 'Australian Open', surface: 'Hard', category: 'GrandSlam', country_code: 'AUS', city: 'Melbourne' },
    winner: { id: 2, sackmann_id: null, slug: 'andre-agassi', first_name: 'Andre', last_name: 'Agassi', country_code: 'USA', hand: 'R', birth_date: null, height_cm: 180, atp_peak_rank: 1, grand_slams: 8, active_from: 1986, active_to: 2006, bio_it: null, bio_en: null, bio_source: null, clerici_url: null, photo_url: null, photo_credit: null },
    loser:  { id: 3, sackmann_id: null, slug: 'pete-sampras',  first_name: 'Pete',  last_name: 'Sampras', country_code: 'USA', hand: 'R', birth_date: null, height_cm: 185, atp_peak_rank: 1, grand_slams: 14, active_from: 1988, active_to: 2002, bio_it: null, bio_en: null, bio_source: null, clerici_url: null, photo_url: null, photo_credit: null },
    w_ace: 10, w_df: 3, w_svpt: 112, w_1stIn: 72, w_1stWon: 48, w_2ndWon: 24, w_SvGms: 19, w_bpSaved: 5, w_bpFaced: 9,
    l_ace: 24, l_df: 2, l_svpt: 108, l_1stIn: 65, l_1stWon: 42, l_2ndWon: 20, l_SvGms: 18, l_bpSaved: 4, l_bpFaced: 11,
    youtube_video_id: null, youtube_channel: null, youtube_verified_at: null, youtube_tommasi_id: null, youtube_tommasi_channel: null, youtube_tommasi_searched_at: null,
    clerici_article_url: null, clerici_excerpt_it: null, editorial_note_it: null,
    clerici_source: null, clerici_article_title: null, clerici_verified_at: null, featured: true, featured_week: '1995-01-29',
  },
]

async function getFeatured(): Promise<Match[]> {
  try {
    const data = await getFeaturedMatches(10)
    return data.length > 0 ? data : MOCK_FEATURED
  } catch {
    return MOCK_FEATURED
  }
}

export default async function HomePage() {
  const featured = await getFeatured()

  return (
    <>
      {/* ── HERO ──────────────────────────────────────────────── */}
      <section
        style={{
          background: '#1C1A17',
          position: 'relative',
          overflow: 'hidden',
          padding: '72px 0 64px',
        }}
      >
        {/* Griglia linee */}
        <div
          className="hero-grid"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        />

        <div
          className="max-w-7xl mx-auto px-6"
          style={{
            position: 'relative', zIndex: 1,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) auto',
            gap: 'clamp(24px, 4vw, 64px)',
            alignItems: 'center',
          }}
        >
          {/* Testo a sinistra */}
          <div>
            <p
              className="fade-in-up fade-in-up-1"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase',
                color: '#9C7C3E', marginBottom: 24,
                display: 'flex', alignItems: 'center', gap: 10,
              }}
            >
              <span style={{ display: 'inline-block', width: 24, height: 1, background: '#9C7C3E' }} />
              Archivio editoriale · 1980-2002
            </p>

            <h1
              className="fade-in-up fade-in-up-2"
              style={{
                fontFamily: "'Source Serif 4', serif",
                fontSize: 'clamp(32px, 5vw, 52px)',
                lineHeight: 1.1, color: '#FFFFFF',
                marginBottom: 24, maxWidth: 720,
              }}
            >
              Ventitré anni di tennis raccontati con i numeri e con le parole
            </h1>

            <p
              className="fade-in-up fade-in-up-3"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 16, lineHeight: 1.7,
                color: 'rgba(255,255,255,0.6)',
                maxWidth: 600, marginBottom: 36,
              }}
            >
              Dal 1980 al 2002 — dalla generazione di Borg e McEnroe a quella di Hewitt e Safin,
              passando per gli anni di Sampras, Agassi, Becker, Edberg, Lendl, Courier. Statistiche
              complete dal dataset Sackmann, video storici dai canali ufficiali, e le voci di Gianni
              Clerici e Rino Tommasi dove la rete le conserva ancora.
            </p>

            <div className="fade-in-up fade-in-up-4" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link
                href="/partite"
                className="transition-transform active:translate-y-px hover:brightness-110"
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                  background: '#B54A2C', color: '#ffffff', textDecoration: 'none',
                  padding: '12px 24px', borderRadius: 2,
                }}
              >
                Esplora le partite
              </Link>
              <Link
                href="/giocatori"
                className="transition-colors active:translate-y-px hover:border-white/40 hover:text-white"
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                  background: 'transparent', color: 'rgba(255,255,255,0.65)',
                  textDecoration: 'none', padding: '12px 24px',
                  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 2,
                }}
              >
                I giocatori
              </Link>
            </div>

            {/* Stat banner */}
            <div style={{ marginTop: 48, display: 'flex', gap: 36, flexWrap: 'wrap' }}>
              {[
                { num: '23',                label: 'Anni di tennis' },
                { num: '4 Slam',            label: 'Per ogni stagione' },
                { num: 'Clerici · Tommasi', label: 'Le voci narranti' },
              ].map(({ num, label }) => (
                <div key={label}>
                  <p
                    style={{
                      fontFamily: "'Bebas Neue', Impact, sans-serif",
                      fontSize: 32, color: '#9C7C3E',
                      lineHeight: 1, letterSpacing: '0.02em',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {num}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.4)', marginTop: 5,
                    }}
                  >
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Carosello dittici iconici */}
          <HeroDuoCarousel />
        </div>
      </section>

      {/* ── PARTITE IN EVIDENZA ──────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6" style={{ marginTop: 64 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
          <div>
            <p
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#7C7568',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ display: 'inline-block', width: 20, height: 1, background: '#7C7568', opacity: 0.4 }} />
              Partite in evidenza
            </p>
            <h2
              style={{
                fontFamily: "'Source Serif 4', serif",
                fontSize: 28,
                color: '#1C1A17',
                lineHeight: 1.2,
              }}
            >
              Le partite della settimana
            </h2>
          </div>
          <Link
            href="/partite"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#B54A2C',
              textDecoration: 'none',
            }}
          >
            Vedi tutte →
          </Link>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))',
            gridAutoRows: '1fr',
            gap: 16,
          }}
        >
          {featured.map((match, i) => (
            <div key={match.id} className={i === 0 ? 'md:col-span-2' : undefined}>
              <ScoreCard match={match} showNumber={i + 1} featured={i === 0} />
            </div>
          ))}
        </div>
      </section>

      <SectionDivider />

      {/* ── BRAND PROMISE ────────────────────────────────────── */}
      <section
        className="max-w-7xl mx-auto px-6"
        style={{ maxWidth: 720, marginLeft: 'auto', marginRight: 'auto', textAlign: 'center', padding: '0 24px' }}
      >
        <blockquote
          style={{
            fontFamily: "'Source Serif 4', serif",
            fontStyle: 'italic',
            fontSize: 'clamp(18px, 2.5vw, 24px)',
            lineHeight: 1.65,
            color: '#1C1A17',
          }}
        >
          Ogni partita di quegli anni ha una storia che i numeri non raccontano da soli
          e le parole non raccontano senza i numeri. Noi le raccontiamo insieme.
        </blockquote>
      </section>

      <SectionDivider />

      {/* ── TORNEI PRINCIPALI ────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6">
        <p
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#7C7568',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ display: 'inline-block', width: 20, height: 1, background: '#7C7568', opacity: 0.4 }} />
          I Grandi Slam
        </p>
        <h2
          style={{
            fontFamily: "'Source Serif 4', serif",
            fontSize: 28,
            color: '#1C1A17',
            lineHeight: 1.2,
            marginBottom: 32,
          }}
        >
          Quattro appuntamenti, ventitré stagioni di storia
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))',
            gap: 12,
          }}
        >
          {[
            { slug: 'australian-open', name: 'Australian Open', surface: 'Cemento', city: 'Melbourne', color: '#1A5A9A' },
            { slug: 'roland-garros',   name: 'Roland Garros',   surface: 'Terra Rossa', city: 'Parigi',    color: '#8B3A1A' },
            { slug: 'wimbledon',       name: 'Wimbledon',       surface: 'Erba',     city: 'Londra',    color: '#2A5A2A' },
            { slug: 'us-open',         name: 'US Open',         surface: 'Cemento', city: 'New York',  color: '#1A2A5A' },
          ].map(({ slug, name, surface, city, color }) => (
            <Link
              key={slug}
              href={`/tornei/${slug}`}
              style={{ textDecoration: 'none' }}
            >
              <div
                className="lift-on-hover"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(28,26,23,0.08)',
                  borderRadius: 2,
                  padding: '24px 20px',
                  borderTop: `3px solid ${color}`,
                }}
              >
                <p
                  style={{
                    fontFamily: "'Source Serif 4', serif",
                    fontSize: 20,
                    color: '#1C1A17',
                    letterSpacing: '0.05em',
                    marginBottom: 4,
                  }}
                >
                  {name}
                </p>
                <p
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 11,
                    color: '#7C7568',
                    letterSpacing: '0.06em',
                  }}
                >
                  {city} · {surface}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <SectionDivider />

      {/* ── NEWSLETTER ────────────────────────────────────────── */}
      <section
        className="hero-loc-texture"
        style={{
          background: '#1C1A17',
          padding: '64px 0',
          position: 'relative',
          overflow: 'hidden',
          '--hero-loc-image': "url('/loc/loc-tennis-player.jpg')",
        } as React.CSSProperties}
      >
        <div
          className="hero-grid"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        />
        <div
          className="max-w-7xl mx-auto px-6"
          style={{ maxWidth: 600, textAlign: 'center', position: 'relative', zIndex: 1 }}
        >
          <p
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#9C7C3E',
              marginBottom: 16,
            }}
          >
            Newsletter settimanale
          </p>
          <h2
            style={{
              fontFamily: "'Source Serif 4', serif",
              fontSize: 28,
              color: '#FFFFFF',
              lineHeight: 1.3,
              marginBottom: 12,
            }}
          >
            Una partita. Ogni martedì.
          </h2>
          <p
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 14,
              lineHeight: 1.7,
              color: 'rgba(255,255,255,0.5)',
              marginBottom: 28,
            }}
          >
            Statistiche, video e la voce di Clerici su una partita storica degli anni &#39;90.
            Nessun spam. Disdici quando vuoi.
          </p>
          <NewsletterForm source="homepage" />
        </div>
      </section>
    </>
  )
}

