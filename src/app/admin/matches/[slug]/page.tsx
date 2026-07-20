import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getMatchBySlug, getCulturalImpactsForMatch } from '@/lib/supabase'
import type { CulturalImpact } from '@/lib/types'
import { ROUND_LABELS } from '@/lib/types'
import { saveMatchEditorial } from '../actions'
import { CulturalImpactsManager } from '../../_components/CulturalImpactsManager'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function AdminMatchEditPage({ params }: Props) {
  const { slug } = await params
  const match = await getMatchBySlug(slug)
  if (!match) notFound()

  let impacts: CulturalImpact[] = []
  try { impacts = await getCulturalImpactsForMatch(match.id) } catch { /* ok */ }

  const winner = match.winner
  const loser  = match.loser
  const tourn  = match.tournament

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '32px 24px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <nav style={{ marginBottom: 18, fontSize: 12, color: '#7C7568' }}>
        <Link href="/admin/matches" style={{ color: '#B54A2C', textDecoration: 'none' }}>← Tutte le partite</Link>
        <span style={{ margin: '0 8px', color: 'rgba(28,26,23,0.2)' }}>·</span>
        <Link href={`/partite/${match.slug}`} target="_blank" style={{ color: '#7C7568', textDecoration: 'none' }}>
          Vedi pagina pubblica ↗
        </Link>
      </nav>

      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7C7568', marginBottom: 6 }}>
          {tourn?.name ?? ''} {match.year} · {ROUND_LABELS[match.round] ?? match.round}
        </p>
        <h1 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 28, color: '#1C1A17', lineHeight: 1.2 }}>
          {winner?.first_name} {winner?.last_name} <span style={{ fontWeight: 400, color: '#7C7568' }}>b.</span> {loser?.first_name} {loser?.last_name}
        </h1>
        <p style={{
          fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 18, color: '#B54A2C',
          fontVariantNumeric: 'tabular-nums', marginTop: 4,
        }}>
          {match.score}
        </p>
      </div>

      <Section title="Video YouTube · Note editoriale · Featured">
        <form action={saveMatchEditorial} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input type="hidden" name="id" value={match.id} />
          <input type="hidden" name="slug" value={match.slug} />

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <Field
              label="URL YouTube o Video ID"
              name="youtube_url"
              defaultValue={match.youtube_video_id ? `https://www.youtube.com/watch?v=${match.youtube_video_id}` : ''}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <Field
              label="Canale (opzionale)"
              name="youtube_channel"
              defaultValue={match.youtube_channel ?? ''}
              placeholder="Es. US Open Tennis Championships"
            />
          </div>

          <div>
            <label style={labelStyle}>Nota editoriale (italiano)</label>
            <textarea
              name="editorial_note_it"
              defaultValue={match.editorial_note_it ?? ''}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              placeholder="Descrizione breve da mostrare nella scheda..."
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#1C1A17', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="featured"
              defaultChecked={match.featured}
              style={{ width: 16, height: 16, accentColor: '#9C7C3E' }}
            />
            <span style={{ fontWeight: 500 }}>In primo piano (featured)</span>
            <span style={{ color: '#7C7568' }}>— viene mostrata in homepage e nella sezione Clerici</span>
          </label>

          <button type="submit" style={primaryButton}>Salva contenuto</button>
        </form>
      </Section>

      <Section title="Riquadri culturali (libri, film, pubblicità...)">
        <CulturalImpactsManager
          items={impacts}
          context={{ kind: 'match', id: match.id }}
        />
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{
        fontFamily: "'Source Serif 4', Georgia, serif",
        fontSize: 18, fontWeight: 600, color: '#1C1A17',
        marginBottom: 14, paddingBottom: 8,
        borderBottom: '1px solid rgba(28,26,23,0.12)',
      }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 9, fontWeight: 500, letterSpacing: '0.12em',
  textTransform: 'uppercase', color: '#7C7568', marginBottom: 4,
}

const inputStyle: React.CSSProperties = {
  width: '100%', fontSize: 13, padding: '8px 10px',
  border: '1px solid rgba(28,26,23,0.15)', borderRadius: 2,
  boxSizing: 'border-box', color: '#1C1A17',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
}

const primaryButton: React.CSSProperties = {
  alignSelf: 'flex-start', fontSize: 11, fontWeight: 600,
  letterSpacing: '0.06em', textTransform: 'uppercase',
  padding: '9px 22px', background: '#B54A2C', color: '#FFFFFF',
  border: 'none', borderRadius: 2, cursor: 'pointer',
}

function Field({ label, name, defaultValue, placeholder }: {
  label: string; name: string; defaultValue: string; placeholder?: string
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type="text" name={name} defaultValue={defaultValue} placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  )
}
