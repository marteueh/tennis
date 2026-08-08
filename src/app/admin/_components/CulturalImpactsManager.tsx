import type { CulturalImpact } from '@/lib/types'
import { saveCulturalImpact, deleteCulturalImpactAction } from '../_actions/cultural'

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'book',        label: 'Libro' },
  { value: 'film',        label: 'Film' },
  { value: 'documentary', label: 'Documentario' },
  { value: 'ad',          label: 'Pubblicità' },
  { value: 'article',     label: 'Articolo' },
  { value: 'quote',       label: 'Citazione' },
  { value: 'moment',      label: 'Momento storico' },
]

const LEVEL_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: 'direct',     label: 'Diretto',    color: 'var(--accent)' },
  { value: 'contextual', label: 'Contestuale', color: 'var(--muted)' },
  { value: 'archetypal', label: 'Archetipo',   color: 'var(--gold)' },
]

interface Props {
  items: CulturalImpact[]
  context:
    | { kind: 'player';     id: number }
    | { kind: 'match';      id: number }
    | { kind: 'tournament'; id: number }
}

export function CulturalImpactsManager({ items, context }: Props) {
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {items.length === 0 && (
          <p style={{ fontSize: 12, color: 'rgba(var(--ink-rgb),0.4)', fontStyle: 'italic', padding: '16px 0' }}>
            Nessun riquadro associato. Aggiungi il primo qui sotto.
          </p>
        )}
        {items.map(item => (
          <ImpactRow key={item.id} item={item} context={context} />
        ))}
      </div>

      {/* Form nuovo riquadro */}
      <details
        style={{
          background: '#FFFFFF',
          border: '1px dashed rgba(var(--accent-rgb),0.4)',
          borderRadius: 2,
          padding: '0',
        }}
      >
        <summary style={{
          padding: '12px 16px', cursor: 'pointer',
          fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
          color: 'var(--accent)', listStyle: 'none',
        }}>
          + Aggiungi nuovo riquadro
        </summary>
        <div style={{ borderTop: '1px solid rgba(var(--accent-rgb),0.15)', padding: '16px' }}>
          <ImpactForm context={context} />
        </div>
      </details>
    </div>
  )
}

function ImpactRow({ item, context }: { item: CulturalImpact; context: Props['context'] }) {
  const levelCfg = LEVEL_OPTIONS.find(l => l.value === item.link_level) ?? LEVEL_OPTIONS[1]
  const typeLabel = TYPE_OPTIONS.find(t => t.value === item.type)?.label ?? item.type
  return (
    <details
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(var(--ink-rgb),0.08)',
        borderLeft: `3px solid ${levelCfg.color}`,
        borderRadius: 2,
      }}
    >
      <summary style={{
        padding: '10px 14px', cursor: 'pointer', listStyle: 'none',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        {item.emoji && <span style={{ fontSize: 16 }}>{item.emoji}</span>}
        <span style={{
          fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
          padding: '2px 6px', background: 'rgba(var(--ink-rgb),0.05)', color: 'var(--muted)', borderRadius: 2,
        }}>
          {typeLabel}
        </span>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', flex: 1 }}>
          {item.title}
        </span>
        {item.year && (
          <span style={{ fontSize: 11, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>
            {item.year}
          </span>
        )}
        <span style={{
          fontSize: 9, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase',
          color: levelCfg.color,
        }}>
          {levelCfg.label}
        </span>
      </summary>
      <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(var(--ink-rgb),0.06)' }}>
        <ImpactForm item={item} context={context} />
        <form action={deleteCulturalImpactAction} style={{ marginTop: 12 }}>
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="context_kind" value={context.kind} />
          <input type="hidden" name="context_id" value={context.id} />
          <button
            type="submit"
            style={{
              fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase',
              padding: '6px 12px', background: 'transparent', color: '#9CA3AF',
              border: '1px solid rgba(220,38,38,0.2)', borderRadius: 2, cursor: 'pointer',
            }}
            className="hover:!text-red-600 hover:!border-red-500"
          >
            🗑 Elimina
          </button>
        </form>
      </div>
    </details>
  )
}

function ImpactForm({ item, context }: { item?: CulturalImpact; context: Props['context'] }) {
  return (
    <form action={saveCulturalImpact} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {item && <input type="hidden" name="id" value={item.id} />}
      <input type="hidden" name="context_kind" value={context.kind} />
      <input type="hidden" name="context_id"   value={context.id} />

      <div style={{ display: 'grid', gridTemplateColumns: '120px 60px 1fr', gap: 8 }}>
        <Field label="Tipo" name="type" defaultValue={item?.type ?? 'book'} as="select" options={TYPE_OPTIONS} />
        <Field label="Emoji" name="emoji" defaultValue={item?.emoji ?? ''} placeholder="📕" />
        <Field label="Titolo" name="title" defaultValue={item?.title ?? ''} required />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 140px', gap: 8 }}>
        <Field label="Anno" name="year" defaultValue={item?.year?.toString() ?? ''} type="number" />
        <Field label="Autore" name="author" defaultValue={item?.author ?? ''} placeholder="Es. Andre Agassi" />
        <Field label="Livello" name="link_level" defaultValue={item?.link_level ?? 'direct'} as="select" options={LEVEL_OPTIONS} />
      </div>

      <Field label="URL fonte" name="url" type="url" defaultValue={item?.url ?? ''} placeholder="https://..." />

      <div>
        <label style={labelStyle}>Testo</label>
        <textarea
          name="body"
          required
          defaultValue={item?.body ?? ''}
          rows={4}
          style={{
            ...inputStyle,
            resize: 'vertical',
            fontFamily: "var(--font-sans)",
            lineHeight: 1.5,
          }}
        />
      </div>

      <button
        type="submit"
        style={{
          alignSelf: 'flex-start',
          fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
          padding: '8px 18px', background: 'var(--accent)', color: '#FFFFFF',
          border: 'none', borderRadius: 2, cursor: 'pointer',
        }}
      >
        {item ? 'Aggiorna' : 'Crea riquadro'}
      </button>
    </form>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 9, fontWeight: 500, letterSpacing: '0.12em',
  textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4,
}

const inputStyle: React.CSSProperties = {
  width: '100%', fontSize: 13, padding: '7px 10px',
  border: '1px solid rgba(var(--ink-rgb),0.15)', borderRadius: 2,
  boxSizing: 'border-box', color: 'var(--ink)',
  fontFamily: "var(--font-sans)",
}

interface FieldProps {
  label: string
  name: string
  defaultValue: string
  type?: string
  placeholder?: string
  required?: boolean
  as?: 'input' | 'select'
  options?: { value: string; label: string }[]
}

function Field({ label, name, defaultValue, type = 'text', placeholder, required, as = 'input', options }: FieldProps) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {as === 'select' && options ? (
        <select name={name} defaultValue={defaultValue} style={inputStyle}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          required={required}
          style={inputStyle}
        />
      )}
    </div>
  )
}
