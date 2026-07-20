import Link from 'next/link'

export const metadata = { title: 'Controlla la tua email — Ace Chronicle' }

export default function VerifyRequestPage() {
  return (
    <div style={{ maxWidth: 440, margin: '60px auto', padding: '0 24px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9C7C3E', marginBottom: 8 }}>
        Magic link inviato
      </p>
      <h1 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 30, color: '#1C1A17', marginBottom: 16 }}>
        Controlla la tua casella
      </h1>
      <div style={{
        padding: '20px 22px',
        background: 'rgba(181,74,44,0.05)',
        border: '1px solid rgba(181,74,44,0.15)',
        borderLeft: '3px solid #B54A2C',
        borderRadius: '0 2px 2px 0',
      }}>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: '#1C1A17', marginBottom: 10 }}>
          Ti abbiamo inviato un link per accedere. Clicca sul pulsante nell&apos;email per entrare.
        </p>
        <p style={{ fontSize: 13, lineHeight: 1.7, color: '#7C7568' }}>
          Il link scade in 24 ore. Se non lo trovi, controlla nella cartella spam.
        </p>
      </div>
      <p style={{ marginTop: 24, fontSize: 12 }}>
        <Link href="/auth/signin" style={{ color: '#B54A2C', textDecoration: 'none' }}>← Cambia indirizzo email</Link>
      </p>
    </div>
  )
}
