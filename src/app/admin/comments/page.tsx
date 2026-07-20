import Link from 'next/link'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import {
  getAdminComments,
  getAdminCommentCounts,
  type AdminCommentRow,
} from '@/lib/supabase'
import {
  approveComment, rejectComment,
  bulkApprove, bulkReject,
  changeUserRole,
} from './actions'

export const dynamic = 'force-dynamic'

const TABS: { value: 'pending' | 'flagged' | 'approved' | 'rejected'; label: string; color: string }[] = [
  { value: 'pending',  label: 'Da moderare', color: '#534AB7' },
  { value: 'flagged',  label: 'Segnalati',   color: '#DC2626' },
  { value: 'approved', label: 'Approvati',   color: '#16A34A' },
  { value: 'rejected', label: 'Rifiutati',   color: '#9CA3AF' },
]

interface Props {
  searchParams: Promise<{ status?: string; q?: string }>
}

export default async function AdminCommentsPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'admin') {
    redirect('/auth/signin?callbackUrl=/admin/comments')
  }

  const { status: statusRaw = 'pending', q } = await searchParams
  const status = (TABS.find(t => t.value === statusRaw)?.value ?? 'pending') as typeof TABS[number]['value']

  let comments: AdminCommentRow[] = []
  let counts = { pending: 0, approved: 0, rejected: 0, flagged: 0 }
  let error: string | null = null
  try {
    [comments, counts] = await Promise.all([
      getAdminComments({ status, search: q, limit: 100 }),
      getAdminCommentCounts(),
    ])
  } catch (e) {
    error = (e as Error).message
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ marginBottom: 18 }}>
        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7A7870', marginBottom: 6 }}>
          Admin · Moderazione
        </p>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: '#1A1A1A' }}>
          Commenti
        </h1>
      </div>

      {/* Tab status */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {TABS.map(t => {
          const active = t.value === status
          const count = counts[t.value]
          return (
            <Link
              key={t.value}
              href={`/admin/comments?status=${t.value}${q ? `&q=${q}` : ''}`}
              style={{
                fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                padding: '6px 14px', borderRadius: 2, textDecoration: 'none',
                background: active ? t.color : 'transparent',
                color: active ? '#FFFFFF' : t.color,
                border: `1px solid ${t.color}`,
              }}
            >
              {t.label} ({count})
            </Link>
          )
        })}
      </div>

      <form method="get" style={{ marginBottom: 18 }}>
        <input type="hidden" name="status" value={status} />
        <input
          type="text"
          name="q"
          defaultValue={q ?? ''}
          placeholder="Cerca nel testo o per email..."
          style={{
            width: 320, fontSize: 13, padding: '8px 12px',
            border: '1px solid rgba(26,26,26,0.15)', borderRadius: 2, color: '#1A1A1A',
          }}
        />
      </form>

      {error && (
        <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 4, fontSize: 13, color: '#991B1B' }}>
          DB: {error}
        </div>
      )}

      {comments.length === 0 ? (
        <p style={{ fontSize: 13, color: 'rgba(26,26,26,0.4)', fontStyle: 'italic', padding: '32px 0', textAlign: 'center' }}>
          Nessun commento {status === 'pending' ? 'da moderare' : `nella sezione "${TABS.find(t=>t.value===status)?.label}"`}.
        </p>
      ) : (
        <form action={bulkApprove}>
          <BulkActions />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
            {comments.map(c => <CommentCard key={c.id} comment={c} />)}
          </div>
        </form>
      )}
    </div>
  )
}

function BulkActions() {
  return (
    <div style={{
      display: 'flex', gap: 8, padding: '10px 14px',
      background: '#FFFFFF', border: '1px solid rgba(26,26,26,0.08)',
      borderRadius: 2, alignItems: 'center',
    }}>
      <span style={{ fontSize: 11, color: '#7A7870' }}>Azioni in massa sui selezionati:</span>
      <button
        type="submit"
        formAction={bulkApprove}
        style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
          padding: '6px 14px', background: '#16A34A', color: '#FFFFFF',
          border: 'none', borderRadius: 2, cursor: 'pointer',
        }}
      >
        ✓ Approva
      </button>
      <button
        type="submit"
        formAction={bulkReject}
        style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
          padding: '6px 14px', background: '#9CA3AF', color: '#FFFFFF',
          border: 'none', borderRadius: 2, cursor: 'pointer',
        }}
      >
        ✗ Rifiuta
      </button>
    </div>
  )
}

function CommentCard({ comment: c }: { comment: AdminCommentRow }) {
  const date = new Date(c.created_at)
  const dateLabel = date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(26,26,26,0.08)',
        borderLeft: c.status === 'flagged' ? '3px solid #DC2626'
                   : c.status === 'pending' ? '3px solid #534AB7'
                   : c.status === 'approved' ? '3px solid #16A34A'
                   : '3px solid #9CA3AF',
        borderRadius: 2,
        padding: '14px 16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <input type="checkbox" name="ids" value={c.id} style={{ marginTop: 4, accentColor: '#534AB7' }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'baseline', marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>
              {c.user_name ?? c.user_email}
            </span>
            <span style={{ fontSize: 11, color: '#7A7870' }}>
              {c.user_email}
            </span>
            <RoleBadge role={c.user_role} />
            <span style={{ fontSize: 11, color: '#7A7870', marginLeft: 'auto' }}>
              {dateLabel}
            </span>
          </div>
          <p style={{ fontSize: 11, color: '#7A7870' }}>
            <Link href={`/partite/${c.match_slug}`} target="_blank" style={{ color: '#534AB7', textDecoration: 'none' }}>
              {c.match_winner_name} b. {c.match_loser_name} · {c.match_tournament_name} {c.match_year} ({c.match_round}) ↗
            </Link>
          </p>
        </div>
      </div>

      <p style={{
        fontSize: 14, lineHeight: 1.6, color: '#1A1A1A',
        whiteSpace: 'pre-wrap',
        padding: '8px 12px',
        background: 'rgba(26,26,26,0.03)',
        borderRadius: 2,
        marginBottom: 10,
      }}>
        {c.body}
      </p>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {c.status !== 'approved' && (
          <form action={approveComment} style={{ display: 'inline' }}>
            <input type="hidden" name="id" value={c.id} />
            <button type="submit" style={btnApprove}>✓ Approva</button>
          </form>
        )}
        {c.status !== 'rejected' && (
          <form action={rejectComment} style={{ display: 'inline' }}>
            <input type="hidden" name="id" value={c.id} />
            <button type="submit" style={btnReject}>✗ Rifiuta</button>
          </form>
        )}
        <form action={changeUserRole} style={{ display: 'inline-flex', gap: 4, marginLeft: 'auto' }}>
          <input type="hidden" name="user_id" value={c.user_id} />
          <select name="role" defaultValue={c.user_role} style={{
            fontSize: 11, padding: '4px 8px',
            border: '1px solid rgba(26,26,26,0.15)', borderRadius: 2,
            color: '#1A1A1A',
          }}>
            <option value="user">user</option>
            <option value="trusted">trusted</option>
            <option value="admin">admin</option>
            <option value="banned">banned</option>
          </select>
          <button type="submit" style={btnGhost}>Imposta ruolo</button>
        </form>
      </div>
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const cfg: Record<string, { bg: string; fg: string }> = {
    admin:   { bg: 'rgba(200,168,92,0.15)', fg: '#92400E' },
    trusted: { bg: 'rgba(34,197,94,0.1)',   fg: '#16A34A' },
    banned:  { bg: 'rgba(220,38,38,0.1)',   fg: '#991B1B' },
    user:    { bg: 'rgba(26,26,26,0.05)',   fg: '#7A7870' },
  }
  const c = cfg[role] ?? cfg.user
  return (
    <span style={{
      fontSize: 9, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase',
      padding: '2px 6px', borderRadius: 2,
      background: c.bg, color: c.fg,
    }}>
      {role}
    </span>
  )
}

const btnApprove: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
  padding: '6px 12px', background: '#16A34A', color: '#FFFFFF',
  border: 'none', borderRadius: 2, cursor: 'pointer',
}
const btnReject: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
  padding: '6px 12px', background: 'transparent', color: '#9CA3AF',
  border: '1px solid rgba(220,38,38,0.3)', borderRadius: 2, cursor: 'pointer',
}
const btnGhost: React.CSSProperties = {
  fontSize: 11, fontWeight: 500, letterSpacing: '0.06em',
  padding: '4px 10px', background: 'transparent', color: '#534AB7',
  border: '1px solid rgba(83,74,183,0.3)', borderRadius: 2, cursor: 'pointer',
}
