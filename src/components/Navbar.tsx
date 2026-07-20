'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'

const NAV_LINKS = [
  { href: '/partite',          label: 'Partite' },
  { href: '/giocatori',        label: 'Giocatori' },
  { href: '/tornei',           label: 'Tornei' },
  { href: '/la-voce-narrante', label: 'Le Voci Narranti' },
]

export function Navbar() {
  const pathname  = usePathname()
  const router    = useRouter()
  const session   = useSession()
  const [open, setOpen]     = useState(false)
  const [query, setQuery]   = useState('')
  const [userMenu, setUserMenu] = useState(false)
  const inputRef  = useRef<HTMLInputElement>(null)
  const wrapRef   = useRef<HTMLDivElement>(null)
  const userRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenu(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    router.push(`/giocatori?q=${encodeURIComponent(q)}`)
    setQuery('')
    setOpen(false)
  }

  return (
    <header
      style={{
        background: '#FFFFFF',
        borderBottom: '1px solid rgba(26,26,26,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Riga superiore: masthead centrato */}
      <div
        style={{
          borderBottom: '1px solid rgba(26,26,26,0.08)',
          padding: '12px 24px 10px',
          textAlign: 'center',
        }}
      >
        <Link href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
          <span
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(22px, 3vw, 32px)',
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: '#1A1A1A',
              lineHeight: 1,
            }}
          >
            Ace Chronicle
          </span>
          <div
            style={{
              marginTop: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <div style={{ flex: 1, maxWidth: 60, height: 1, background: '#C8A85C', opacity: 0.6 }} />
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 9,
                fontWeight: 500,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#7A7870',
              }}
            >
              Archivio del tennis 1980-2002
            </span>
            <div style={{ flex: 1, maxWidth: 60, height: 1, background: '#C8A85C', opacity: 0.6 }} />
          </div>
        </Link>
      </div>

      {/* Riga inferiore: nav + ricerca */}
      <nav className="max-w-7xl mx-auto px-6 h-10 flex items-center justify-between gap-8">

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: active ? '#1A1A1A' : '#7A7870',
                  textDecoration: 'none',
                  transition: 'color 0.15s',
                  borderBottom: active ? '1px solid #534AB7' : '1px solid transparent',
                  paddingBottom: 1,
                }}
              >
                {label}
              </Link>
            )
          })}
        </div>

        {/* Destra: ricerca + newsletter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Search */}
          <div ref={wrapRef} style={{ display: 'flex', alignItems: 'center' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center' }}>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Escape' && (setOpen(false), setQuery(''))}
                placeholder="Cerca giocatore…"
                style={{
                  width: open ? 180 : 0,
                  opacity: open ? 1 : 0,
                  overflow: 'hidden',
                  transition: 'width 0.2s ease, opacity 0.2s ease',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid rgba(26,26,26,0.3)',
                  color: '#1A1A1A',
                  padding: open ? '4px 8px' : 0,
                  outline: 'none',
                  borderRadius: 0,
                }}
              />
            </form>
            <button
              onClick={() => open && query.trim() ? handleSubmit({ preventDefault: () => {} } as React.FormEvent) : setOpen(v => !v)}
              aria-label="Cerca giocatore"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                color: open ? '#1A1A1A' : '#7A7870',
                transition: 'color 0.15s',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10 10L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* User menu */}
          <div ref={userRef} style={{ position: 'relative' }}>
            {session.status === 'authenticated' ? (
              <>
                <button
                  onClick={() => setUserMenu(v => !v)}
                  aria-label="Menu utente"
                  style={{
                    background: 'rgba(83,74,183,0.08)',
                    border: '1px solid rgba(83,74,183,0.2)',
                    color: '#534AB7',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    padding: '4px 10px',
                    cursor: 'pointer',
                    borderRadius: 2,
                  }}
                >
                  {(session.data?.user?.name ?? session.data?.user?.email ?? '?').slice(0, 2).toUpperCase()}
                </button>
                {userMenu && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      right: 0,
                      minWidth: 200,
                      background: '#FFFFFF',
                      border: '1px solid rgba(26,26,26,0.1)',
                      borderRadius: 2,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                      zIndex: 60,
                    }}
                  >
                    <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(26,26,26,0.06)' }}>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#7A7870', marginBottom: 2 }}>Connesso come</p>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#1A1A1A', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {session.data?.user?.email}
                      </p>
                    </div>
                    <Link href="/account" onClick={() => setUserMenu(false)} style={menuItemStyle}>Il mio account</Link>
                    {session.data?.user?.role === 'admin' && (
                      <Link href="/admin" onClick={() => setUserMenu(false)} style={{ ...menuItemStyle, color: '#C8A85C' }}>Admin</Link>
                    )}
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      style={{
                        ...menuItemStyle,
                        width: '100%', textAlign: 'left', background: 'transparent',
                        border: 'none', cursor: 'pointer', borderTop: '1px solid rgba(26,26,26,0.06)',
                      }}
                    >
                      Esci
                    </button>
                  </div>
                )}
              </>
            ) : session.status === 'loading' ? (
              <div style={{ width: 32, height: 28 }} />
            ) : (
              <Link
                href="/auth/signin"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#7A7870',
                  textDecoration: 'none',
                  padding: '4px 8px',
                }}
              >
                Accedi
              </Link>
            )}
          </div>

          {/* CTA newsletter */}
          <Link
            href="/newsletter"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              background: 'transparent',
              color: '#534AB7',
              textDecoration: 'none',
              padding: '4px 12px',
              border: '1px solid rgba(83,74,183,0.4)',
              borderRadius: 0,
              whiteSpace: 'nowrap',
            }}
          >
            Newsletter
          </Link>
        </div>
      </nav>
    </header>
  )
}

const menuItemStyle: React.CSSProperties = {
  display: 'block',
  padding: '10px 14px',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 12,
  color: '#1A1A1A',
  textDecoration: 'none',
}
