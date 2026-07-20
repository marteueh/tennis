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
  direct:       '#B54A2C',
  contextual:   '#7C7568',
  archetypal:   '#9C7C3E',
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
        border: '1px solid rgba(28,26,23,0.08)',
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
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#7C7568',
              background: 'rgba(28,26,23,0.05)',
              padding: '2px 7px',
              borderRadius: 2,
            }}
          >
            {TYPE_LABELS[item.type] ?? item.type}
          </span>
          {item.year && (
            <span
              style={{
                fontFamily: "'Source Serif 4', serif",
                fontSize: 13,
                color: '#7C7568',
                letterSpacing: '0.06em',
              }}
            >
              {item.year}
            </span>
          )}
        </div>
        <span
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 9,
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: LEVEL_COLORS[item.link_level] ?? '#7C7568',
            flexShrink: 0,
          }}
        >
          {LEVEL_LABELS[item.link_level]}
        </span>
      </div>

      {/* Title */}
      <p
        style={{
          fontFamily: "'Source Serif 4', serif",
          fontSize: compact ? 14 : 15,
          color: '#1C1A17',
          lineHeight: 1.4,
        }}
      >
        {item.title}
      </p>

      {/* Author */}
      {item.author && (
        <p
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 11,
            color: '#7C7568',
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
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 13,
          lineHeight: 1.7,
          color: '#1C1A17',
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
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 11,
            fontWeight: 500,
            color: '#B54A2C',
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
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#7C7568',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ display: 'inline-block', width: 20, height: 1, background: '#7C7568', opacity: 0.4 }} />
        {title}
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))',
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
