'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Logo } from './Logo'

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
  const [mobileMenu, setMobileMenu] = useState(false)
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

  // Chiudi il menu mobile quando cambia pagina
  useEffect(() => {
    setMobileMenu(false)
  }, [pathname])

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
        borderBottom: '1px solid rgba(var(--ink-rgb),0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Riga unica: logo a sinistra, nav + azioni a destra */}
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">

        <Logo variant="paper" compact />

        {/* Gruppo destro: nav (desktop), hamburger (mobile), azioni */}
        <div className="flex items-center gap-6">

          {/* Nav links — desktop */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: active ? 'var(--ink)' : 'var(--muted)',
                    textDecoration: 'none',
                    transition: 'color 0.15s',
                    borderBottom: active ? '1px solid var(--accent)' : '1px solid transparent',
                    paddingBottom: 1,
                  }}
                >
                  {label}
                </Link>
              )
            })}
          </div>

          {/* Hamburger — solo mobile */}
          <button
            className="flex md:hidden items-center justify-center"
            onClick={() => setMobileMenu(v => !v)}
            aria-label={mobileMenu ? 'Chiudi menu' : 'Apri menu'}
            aria-expanded={mobileMenu}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 6,
              color: 'var(--ink)',
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              {mobileMenu ? (
                <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              ) : (
                <>
                  <path d="M3 6H17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  <path d="M3 10H17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  <path d="M3 14H17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>

          {/* Ricerca + account + newsletter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Search — solo desktop, su mobile si cerca dal pannello */}
          <div ref={wrapRef} className="hidden md:flex" style={{ alignItems: 'center' }}>
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
                  fontFamily: "var(--font-sans)",
                  fontSize: 12,
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid rgba(var(--ink-rgb),0.3)',
                  color: 'var(--ink)',
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
                color: open ? 'var(--ink)' : 'var(--muted)',
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
                    background: 'rgba(var(--accent-rgb),0.08)',
                    border: '1px solid rgba(var(--accent-rgb),0.2)',
                    color: 'var(--accent)',
                    fontFamily: "var(--font-sans)",
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
                      border: '1px solid rgba(var(--ink-rgb),0.1)',
                      borderRadius: 2,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                      zIndex: 60,
                    }}
                  >
                    <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(var(--ink-rgb),0.06)' }}>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>Connesso come</p>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: 'var(--ink)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {session.data?.user?.email}
                      </p>
                    </div>
                    <Link href="/account" onClick={() => setUserMenu(false)} style={menuItemStyle}>Il mio account</Link>
                    {session.data?.user?.role === 'admin' && (
                      <Link href="/admin" onClick={() => setUserMenu(false)} style={{ ...menuItemStyle, color: 'var(--gold)' }}>Admin</Link>
                    )}
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      style={{
                        ...menuItemStyle,
                        width: '100%', textAlign: 'left', background: 'transparent',
                        border: 'none', cursor: 'pointer', borderTop: '1px solid rgba(var(--ink-rgb),0.06)',
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
                  fontFamily: "var(--font-sans)",
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  textDecoration: 'none',
                  padding: '4px 8px',
                }}
              >
                Accedi
              </Link>
            )}
          </div>

          {/* CTA newsletter — solo desktop, su mobile è nel pannello */}
          <Link
            href="/newsletter"
            className="hidden md:inline-block"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              background: 'transparent',
              color: 'var(--accent)',
              textDecoration: 'none',
              padding: '4px 12px',
              border: '1px solid rgba(var(--accent-rgb),0.4)',
              borderRadius: 0,
              whiteSpace: 'nowrap',
            }}
          >
            Newsletter
          </Link>
          </div>
        </div>
      </nav>

      {/* Pannello nav — solo mobile */}
      {mobileMenu && (
        <div
          className="md:hidden"
          style={{
            borderTop: '1px solid rgba(var(--ink-rgb),0.08)',
            background: '#FFFFFF',
          }}
        >
          <nav className="flex flex-col px-6 py-2">
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileMenu(false)}
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 13,
                    fontWeight: 500,
                    letterSpacing: '0.04em',
                    color: active ? 'var(--accent)' : 'var(--ink)',
                    textDecoration: 'none',
                    padding: '12px 0',
                    borderBottom: '1px solid rgba(var(--ink-rgb),0.06)',
                  }}
                >
                  {label}
                </Link>
              )
            })}

            {/* Ricerca — mobile */}
            <form
              onSubmit={e => { handleSubmit(e); setMobileMenu(false) }}
              style={{ display: 'flex', gap: 8, padding: '12px 0', borderBottom: '1px solid rgba(var(--ink-rgb),0.06)' }}
            >
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Cerca giocatore…"
                style={{
                  flex: 1,
                  fontFamily: "var(--font-sans)",
                  fontSize: 13,
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid rgba(var(--ink-rgb),0.2)',
                  color: 'var(--ink)',
                  padding: '4px 0',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                aria-label="Cerca"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4 }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M10 10L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </form>

            <Link
              href="/newsletter"
              onClick={() => setMobileMenu(false)}
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '0.04em',
                color: 'var(--accent)',
                textDecoration: 'none',
                padding: '12px 0',
              }}
            >
              Iscriviti alla newsletter →
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}

const menuItemStyle: React.CSSProperties = {
  display: 'block',
  padding: '10px 14px',
  fontFamily: "var(--font-sans)",
  fontSize: 12,
  color: 'var(--ink)',
  textDecoration: 'none',
}
