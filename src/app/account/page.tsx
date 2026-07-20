import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { getUserApprovedCommentsCount } from '@/lib/supabase'
import { deleteOwnAccount } from './actions'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Il mio account — Ace Chronicle' }

export default async function AccountPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin?callbackUrl=/account')
  const userId = parseInt(session.user.id, 10)
  const approvedCount = await getUserApprovedCommentsCount(userId).catch(() => 0)

  return (
    <div style={{ maxWidth: 640, margin: '40px auto 80px', padding: '0 24px', fontFamily: "'DM Sans', sans-serif" }}>
      <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7A7870', marginBottom: 8 }}>
        Account
      </p>
      <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: '#1A1A1A', marginBottom: 24 }}>
        Il mio account
      </h1>

      {/* Info */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid rgba(26,26,26,0.08)',
        borderRadius: 2,
        padding: '20px 22px',
        marginBottom: 20,
      }}>
        <Row label="Email" value={session.user.email ?? '–'} />
        <Row label="Ruolo" value={session.user.role} />
        <Row label="Commenti approvati" value={String(approvedCount)} />
      </div>

      <p style={{ fontSize: 12, color: '#7A7870', lineHeight: 1.7, marginBottom: 28 }}>
        Memorizziamo solo la tua email e i tuoi commenti. Nessun tracciamento né condivisione con terzi.
      </p>

      {/* Cancellazione account */}
      <div style={{
        background: 'rgba(220,38,38,0.04)',
        border: '1px solid rgba(220,38,38,0.2)',
        borderLeft: '3px solid #DC2626',
        borderRadius: '0 2px 2px 0',
        padding: '16px 20px',
      }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: '#1A1A1A', marginBottom: 8 }}>
          Zona pericolosa
        </h2>
        <p style={{ fontSize: 13, color: '#1A1A1A', lineHeight: 1.6, marginBottom: 14 }}>
          Cancellando l&apos;account elimineremo i tuoi commenti e i tuoi dati personali (email, nome).
          Questa operazione è <strong>irreversibile</strong>.
        </p>
        <form action={deleteOwnAccount}>
          <button
            type="submit"
            style={{
              fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '8px 16px',
              background: 'transparent',
              color: '#DC2626',
              border: '1px solid #DC2626',
              borderRadius: 2,
              cursor: 'pointer',
            }}
          >
            Cancella il mio account
          </button>
        </form>
      </div>

      <p style={{ marginTop: 24, fontSize: 12 }}>
        <Link href="/" style={{ color: '#534AB7', textDecoration: 'none' }}>← Torna al sito</Link>
      </p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '8px 0', borderBottom: '1px solid rgba(26,26,26,0.05)' }}>
      <span style={{ fontSize: 12, color: '#7A7870' }}>{label}</span>
      <span style={{ fontSize: 13, color: '#1A1A1A', fontWeight: 500 }}>{value}</span>
    </div>
  )
}
