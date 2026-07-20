import { signIn } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'Accedi — Ace Chronicle' }

interface Props {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>
}

export default async function SignInPage({ searchParams }: Props) {
  const { callbackUrl, error } = await searchParams

  async function login(formData: FormData) {
    'use server'
    const email = (formData.get('email') as string).trim()
    if (!email) return
    await signIn('nodemailer', { email, redirectTo: callbackUrl ?? '/' })
  }

  return (
    <div style={{ maxWidth: 440, margin: '60px auto', padding: '0 24px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7C7568', marginBottom: 8 }}>
        Accesso
      </p>
      <h1 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 32, color: '#1C1A17', marginBottom: 8 }}>
        Entra nella conversazione
      </h1>
      <p style={{ fontSize: 14, lineHeight: 1.7, color: '#7C7568', marginBottom: 28 }}>
        Inserisci la tua email. Ti invieremo un link sicuro per accedere — niente password da ricordare.
      </p>

      {error && (
        <div style={{
          padding: '12px 16px', background: 'rgba(220,38,38,0.05)',
          border: '1px solid rgba(220,38,38,0.2)', borderRadius: 2,
          marginBottom: 16, fontSize: 13, color: '#991B1B',
        }}>
          {error === 'Verification' ? 'Il link è scaduto o è già stato usato. Richiedine uno nuovo.' :
           error === 'Configuration' ? 'Servizio email non disponibile. Riprova più tardi.' :
           'Si è verificato un errore. Riprova.'}
        </div>
      )}

      <form action={login} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7C7568', marginBottom: 6 }}>
            Email
          </label>
          <input
            type="email"
            name="email"
            required
            autoFocus
            placeholder="tu@esempio.it"
            style={{
              width: '100%', fontSize: 14, padding: '10px 12px',
              border: '1px solid rgba(28,26,23,0.2)', borderRadius: 2,
              boxSizing: 'border-box', color: '#1C1A17',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          />
        </div>
        <button
          type="submit"
          style={{
            fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '12px', background: '#B54A2C', color: '#FFFFFF',
            border: 'none', borderRadius: 2, cursor: 'pointer',
          }}
        >
          Invia magic link
        </button>
      </form>

      <p style={{ marginTop: 28, fontSize: 11, color: 'rgba(28,26,23,0.45)', lineHeight: 1.7 }}>
        Memorizziamo solo la tua email per autenticarti. Nessuna password, nessun tracking.
        Puoi cancellare l&apos;account in qualsiasi momento.
      </p>
      <p style={{ marginTop: 14, fontSize: 11, color: 'rgba(28,26,23,0.4)' }}>
        <Link href="/" style={{ color: '#B54A2C', textDecoration: 'none' }}>← Torna al sito</Link>
      </p>
    </div>
  )
}
