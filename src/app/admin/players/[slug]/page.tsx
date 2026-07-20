import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getPlayerBySlug, getCulturalImpactsForPlayer } from '@/lib/supabase'
import type { CulturalImpact } from '@/lib/types'
import { savePlayerEditorial } from '../actions'
import { addCommercialFromUrl } from '../../_actions/cultural'
import { CulturalImpactsManager } from '../../_components/CulturalImpactsManager'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function AdminPlayerEditPage({ params }: Props) {
  const { slug } = await params
  const player = await getPlayerBySlug(slug)
  if (!player) notFound()

  let impacts: CulturalImpact[] = []
  try { impacts = await getCulturalImpactsForPlayer(player.id) } catch { /* ok */ }

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '32px 24px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Breadcrumb */}
      <nav style={{ marginBottom: 18, fontSize: 12, color: '#7C7568' }}>
        <Link href="/admin/players" style={{ color: '#B54A2C', textDecoration: 'none' }}>← Tutti i giocatori</Link>
        <span style={{ margin: '0 8px', color: 'rgba(28,26,23,0.2)' }}>·</span>
        <Link href={`/giocatori/${player.slug}`} target="_blank" style={{ color: '#7C7568', textDecoration: 'none' }}>
          Vedi pagina pubblica ↗
        </Link>
      </nav>

      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', gap: 20 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7C7568', marginBottom: 6 }}>
            Scheda atleta
          </p>
          <h1 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 32, color: '#1C1A17', lineHeight: 1.1 }}>
            {player.first_name} {player.last_name}
          </h1>
          <p style={{ fontSize: 12, color: '#7C7568', marginTop: 4 }}>
            {player.country_code} · #{player.atp_peak_rank ?? '–'} ATP · {player.grand_slams} Slam
          </p>
        </div>
        {player.photo_url && (
          <div style={{ width: 90, aspectRatio: '3/4', position: 'relative', border: '1px solid rgba(28,26,23,0.08)', flexShrink: 0 }}>
            <Image
              src={player.photo_url}
              alt={`${player.first_name} ${player.last_name}`}
              fill sizes="90px"
              style={{ objectFit: 'cover', objectPosition: 'top center' }}
              unoptimized
            />
          </div>
        )}
      </div>

      {/* Sezione Foto + Bio + Clerici */}
      <Section title="Contenuto editoriale">
        <form action={savePlayerEditorial} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input type="hidden" name="id" value={player.id} />
          <input type="hidden" name="slug" value={player.slug} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="URL foto" name="photo_url" defaultValue={player.photo_url ?? ''} placeholder="/players/... oppure https://..." />
            <Field label="Credito foto" name="photo_credit" defaultValue={player.photo_credit ?? ''} placeholder="Es. Wikimedia Commons (CC-BY-SA)" />
          </div>

          <div>
            <label style={labelStyle}>Bio italiano</label>
            <textarea
              name="bio_it"
              defaultValue={player.bio_it ?? ''}
              rows={6}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              placeholder="Paragrafi separati da una riga vuota..."
            />
          </div>

          <div>
            <label style={labelStyle}>Bio inglese (fallback)</label>
            <textarea
              name="bio_en"
              defaultValue={player.bio_en ?? ''}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              placeholder="Solo se non c'è la bio italiana"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Sorgente bio" name="bio_source" defaultValue={player.bio_source ?? ''} placeholder="es. it.wikipedia.org" />
            <Field label="URL articoli Clerici" name="clerici_url" type="url" defaultValue={player.clerici_url ?? ''} placeholder="https://ricerca.repubblica.it/..." />
          </div>

          <button
            type="submit"
            style={primaryButton}
          >
            Salva contenuto
          </button>
        </form>
      </Section>

      <Section title="Spot pubblicitari — aggiunta rapida YouTube">
        <p style={{ fontSize: 12, color: '#7C7568', marginBottom: 12, lineHeight: 1.6 }}>
          Incolla l&apos;URL YouTube di uno spot con {player.first_name} {player.last_name}.
          Titolo e canale vengono auto-popolati. I campi opzionali (brand, anno, testo) sovrascrivono i valori automatici.
        </p>
        <form
          action={async (fd: FormData) => {
            'use server'
            fd.append('context_kind', 'player')
            fd.append('context_id', String(player.id))
            await addCommercialFromUrl(fd)
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <div>
            <label style={labelStyle}>URL YouTube dello spot</label>
            <input
              type="text"
              name="youtube_url"
              required
              placeholder="https://www.youtube.com/watch?v=..."
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 10 }}>
            <div>
              <label style={labelStyle}>Brand / Marca (opzionale)</label>
              <input type="text" name="brand" placeholder="Es. Nike, Canon, Pepsi" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Anno (opzionale)</label>
              <input type="number" name="year" placeholder="1995" style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Titolo personalizzato (opzionale)</label>
            <input type="text" name="title" placeholder="Lascia vuoto per usare il titolo YouTube" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Descrizione (opzionale)</label>
            <input type="text" name="body" placeholder='Default: "Spot pubblicitario inserito manualmente"' style={inputStyle} />
          </div>

          <button
            type="submit"
            style={{
              alignSelf: 'flex-start',
              fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
              padding: '8px 18px', background: '#9C7C3E', color: '#FFFFFF',
              border: 'none', borderRadius: 2, cursor: 'pointer',
            }}
          >
            📺 Aggiungi spot
          </button>
        </form>
      </Section>

      <Section title="Riquadri culturali (libri, film, pubblicità...)">
        <CulturalImpactsManager
          items={impacts}
          context={{ kind: 'player', id: player.id }}
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

function Field({ label, name, defaultValue, placeholder, type = 'text' }: {
  label: string; name: string; defaultValue: string; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type} name={name} defaultValue={defaultValue} placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  )
}
