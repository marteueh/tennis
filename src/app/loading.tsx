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
      {/* Spinner */}
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        style={{ animation: 'spin 0.8s linear infinite' }}
        aria-hidden="true"
      >
        <circle cx="14" cy="14" r="11" stroke="rgba(var(--ink-rgb),0.12)" strokeWidth="2.5" />
        <path d="M14 3a11 11 0 0 1 11 11" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
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
