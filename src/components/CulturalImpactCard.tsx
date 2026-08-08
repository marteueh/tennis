import type { CulturalImpact } from '@/lib/types'

const TYPE_LABELS: Record<string, string> = {
  book:         'Libro',
  film:         'Film',
  documentary:  'Documentario',
  ad:           'Pubblicità',
  article:      'Articolo',
  quote:        'Citazione',
  moment:       'Momento storico',
}

const LEVEL_LABELS: Record<string, string> = {
  direct:       'Diretto',
  contextual:   'Contestuale',
  archetypal:   'Archetipo',
}

const LEVEL_COLORS: Record<string, string> = {
  direct:       'var(--accent)',
  contextual:   'var(--muted)',
  archetypal:   'var(--gold)',
}

interface Props {
  item: CulturalImpact
  compact?: boolean
}

export function CulturalImpactCard({ item, compact = false }: Props) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(var(--ink-rgb),0.08)',
        borderRadius: 2,
        padding: compact ? '16px 18px' : '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {item.emoji && (
            <span style={{ fontSize: 16, lineHeight: 1 }} aria-hidden="true">{item.emoji}</span>
          )}
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              background: 'rgba(var(--ink-rgb),0.05)',
              padding: '2px 7px',
              borderRadius: 2,
            }}
          >
            {TYPE_LABELS[item.type] ?? item.type}
          </span>
          {item.year && (
            <span
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 13,
                color: 'var(--muted)',
                letterSpacing: '0.06em',
              }}
            >
              {item.year}
            </span>
          )}
        </div>
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 9,
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: LEVEL_COLORS[item.link_level] ?? 'var(--muted)',
            flexShrink: 0,
          }}
        >
          {LEVEL_LABELS[item.link_level]}
        </span>
      </div>

      {/* Title */}
      <p
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: compact ? 14 : 15,
          color: 'var(--ink)',
          lineHeight: 1.4,
        }}
      >
        {item.title}
      </p>

      {/* Author */}
      {item.author && (
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 11,
            color: 'var(--muted)',
            fontStyle: 'italic',
            lineHeight: 1.5,
          }}
        >
          {item.author}
        </p>
      )}

      {/* Body */}
      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 13,
          lineHeight: 1.7,
          color: 'var(--ink)',
        }}
      >
        {item.body}
      </p>

      {/* Link */}
      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 11,
            fontWeight: 500,
            color: 'var(--accent)',
            textDecoration: 'none',
            letterSpacing: '0.03em',
            alignSelf: 'flex-start',
          }}
        >
          Vedi fonte →
        </a>
      )}
    </div>
  )
}

interface SectionProps {
  items: CulturalImpact[]
  title?: string
}

export function CulturalImpactSection({ items, title = "Eco culturale" }: SectionProps) {
  if (!items || items.length === 0) return null

  return (
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
        {title}
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
          gap: 12,
        }}
      >
        {items.map(item => (
          <CulturalImpactCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
