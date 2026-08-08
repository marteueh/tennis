'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div
      style={{
        minHeight: '50vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
      }}
    >
      <h2
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: 24,
          color: 'var(--ink)',
          marginBottom: 12,
        }}
      >
        Qualcosa è andato storto
      </h2>
      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 13,
          color: 'var(--muted)',
          marginBottom: 24,
        }}
      >
        {error.message ?? 'Errore imprevisto. Riprova tra qualche secondo.'}
      </p>
      <button
        onClick={reset}
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          background: 'var(--accent)',
          color: '#ffffff',
          border: 'none',
          padding: '10px 20px',
          borderRadius: 2,
          cursor: 'pointer',
        }}
      >
        Riprova
      </button>
    </div>
  )
}
