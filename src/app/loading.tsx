export default function Loading() {
  return (
    <div
      style={{
        minHeight: '40vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
      }}
    >
      {/* Pallina animata */}
      <svg
        width="32"
        height="32"
        viewBox="0 0 52 52"
        fill="none"
        style={{ animation: 'spin 1.2s linear infinite' }}
        aria-hidden="true"
      >
        <circle cx="26" cy="26" r="22" stroke="#9C7C3E" strokeWidth="2" strokeDasharray="80 60" />
        <path d="M 6 18 C 14 22 38 30 46 34" stroke="#B54A2C" strokeWidth="2" strokeLinecap="round" />
        <path d="M 6 34 C 14 30 38 22 46 18" stroke="#B54A2C" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <p
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#7C7568',
        }}
      >
        Caricamento archivio…
      </p>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
