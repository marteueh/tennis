import Link from 'next/link'

export const metadata = { title: 'Errore — Ace Chronicle' }

const MESSAGES: Record<string, string> = {
  Verification:    'Il link di accesso è scaduto o è già stato usato. Richiedi un nuovo magic link.',
  Configuration:   'Il servizio email non è configurato. Contatta il sito.',
  AccessDenied:    'Accesso negato. Il tuo account potrebbe essere stato sospeso.',
  Default:         'Si è verificato un errore di autenticazione. Riprova.',
}

interface Props {
  searchParams: Promise<{ error?: string }>
}

export default async function AuthErrorPage({ searchParams }: Props) {
  const { error = 'Default' } = await searchParams
  const message = MESSAGES[error] ?? MESSAGES.Default

  return (
    <div style={{ maxWidth: 440, margin: '60px auto', padding: '0 24px', fontFamily: "var(--font-sans)" }}>
      <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#991B1B', marginBottom: 8 }}>
        Errore di autenticazione
      </p>
      <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 28, color: 'var(--ink)', marginBottom: 16 }}>
        Qualcosa è andato storto
      </h1>
      <div style={{
        padding: '16px 18px',
        background: 'rgba(220,38,38,0.05)',
        border: '1px solid rgba(220,38,38,0.18)',
        borderRadius: 2,
      }}>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--ink)' }}>{message}</p>
      </div>
      <p style={{ marginTop: 24, fontSize: 12 }}>
        <Link href="/auth/signin" style={{ color: 'var(--accent)', textDecoration: 'none' }}>← Torna alla pagina di accesso</Link>
      </p>
    </div>
  )
}
