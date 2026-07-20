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
          fontFamily: "'Source Serif 4', serif",
          fontSize: 24,
          color: '#1C1A17',
          marginBottom: 12,
        }}
      >
        Qualcosa è andato storto
      </h2>
      <p
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 13,
          color: '#7C7568',
          marginBottom: 24,
        }}
      >
        {error.message ?? 'Errore imprevisto. Riprova tra qualche secondo.'}
      </p>
      <button
        onClick={reset}
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          background: '#B54A2C',
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
