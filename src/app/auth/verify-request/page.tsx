import Link from 'next/link'

export const metadata = { title: 'Controlla la tua email — Ace Chronicle' }

export default function VerifyRequestPage() {
  return (
    <div style={{ maxWidth: 440, margin: '60px auto', padding: '0 24px', fontFamily: "var(--font-sans)" }}>
      <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>
        Magic link inviato
      </p>
      <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 30, color: 'var(--ink)', marginBottom: 16 }}>
        Controlla la tua casella
      </h1>
      <div style={{
        padding: '20px 22px',
        background: 'rgba(var(--accent-rgb),0.05)',
        border: '1px solid rgba(var(--accent-rgb),0.15)',
        borderLeft: '3px solid var(--accent)',
        borderRadius: '0 2px 2px 0',
      }}>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--ink)', marginBottom: 10 }}>
          Ti abbiamo inviato un link per accedere. Clicca sul pulsante nell&apos;email per entrare.
        </p>
        <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--muted)' }}>
          Il link scade in 24 ore. Se non lo trovi, controlla nella cartella spam.
        </p>
      </div>
      <p style={{ marginTop: 24, fontSize: 12 }}>
        <Link href="/auth/signin" style={{ color: 'var(--accent)', textDecoration: 'none' }}>← Cambia indirizzo email</Link>
      </p>
    </div>
  )
}
