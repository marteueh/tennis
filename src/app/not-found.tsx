import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: 'clamp(80px, 20vw, 160px)',
          lineHeight: 1,
          color: 'rgba(var(--ink-rgb),0.06)',
          letterSpacing: '0.04em',
          marginBottom: 0,
          userSelect: 'none',
        }}
      >
        404
      </p>
      <h1
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: 28,
          color: 'var(--ink)',
          lineHeight: 1.2,
          marginTop: -16,
          marginBottom: 12,
        }}
      >
        Pagina non trovata
      </h1>
      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 14,
          color: 'var(--muted)',
          lineHeight: 1.7,
          maxWidth: 400,
          marginBottom: 32,
        }}
      >
        La pagina che cerchi non esiste o è stata spostata.
        Forse stai cercando una partita nell&#39;archivio?
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <Link
          href="/partite"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            background: 'var(--accent)',
            color: '#ffffff',
            textDecoration: 'none',
            padding: '10px 20px',
            borderRadius: 2,
          }}
        >
          Archivio partite
        </Link>
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            background: 'transparent',
            color: 'var(--muted)',
            textDecoration: 'none',
            padding: '10px 20px',
            border: '1px solid rgba(var(--ink-rgb),0.12)',
            borderRadius: 2,
          }}
        >
          Homepage
        </Link>
      </div>
    </div>
  )
}
