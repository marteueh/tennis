import Link from 'next/link'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = { title: 'Admin — Ace Chronicle' }

const NAV = [
  { href: '/admin',             label: 'Dashboard' },
  { href: '/admin/players',     label: 'Giocatori' },
  { href: '/admin/matches',     label: 'Partite' },
  { href: '/admin/tournaments', label: 'Tornei' },
  { href: '/admin/comments',    label: 'Commenti' },
  { href: '/admin/youtube',     label: 'YouTube' },
  { href: '/admin/clerici',     label: 'Clerici' },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ background: '#FAFAF8', minHeight: '100vh' }}>
      <nav
        style={{
          background: '#1A1A1A',
          color: '#FFFFFF',
          padding: '14px 24px',
          display: 'flex',
          gap: 6,
          alignItems: 'center',
          flexWrap: 'wrap',
          fontFamily: "'DM Sans', sans-serif",
          borderBottom: '2px solid #C8A85C',
        }}
      >
        <span style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 14, fontWeight: 700, letterSpacing: '0.06em',
          marginRight: 18, color: '#C8A85C',
        }}>
          ADMIN
        </span>
        {NAV.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            style={{
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.7)',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: 2,
              transition: 'background 0.15s',
            }}
            className="hover:bg-white/10"
          >
            {label}
          </Link>
        ))}
        <Link
          href="/"
          style={{
            marginLeft: 'auto',
            fontSize: 11,
            color: 'rgba(255,255,255,0.5)',
            textDecoration: 'none',
            letterSpacing: '0.06em',
          }}
        >
          ← Sito pubblico
        </Link>
      </nav>
      {children}
    </div>
  )
}
