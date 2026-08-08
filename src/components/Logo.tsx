import Link from 'next/link'

interface LogoProps {
  variant?: 'dark' | 'paper'
  compact?: boolean
  className?: string
}

export function Logo({ variant = 'dark', compact = false, className = '' }: LogoProps) {
  const textColor = variant === 'dark' ? '#ffffff' : 'var(--ink)'
  const ballSize  = compact ? 17 : 26
  const fontSize  = compact ? 28 : 46
  const eraSize   = compact ? 7.5 : 9.5

  return (
    <Link href="/" className={`inline-flex flex-col items-start select-none no-underline ${className}`}>
      {/* Wordmark row */}
      <div className="flex items-center" style={{ gap: compact ? 7 : 10 }}>
        <span
          style={{
            fontFamily: "'Bebas Neue', Impact, sans-serif",
            fontSize,
            lineHeight: 1,
            letterSpacing: '0.07em',
            color: textColor,
          }}
        >
          ACE
        </span>

        {/* Tennis ball SVG */}
        <svg
          width={ballSize}
          height={ballSize}
          viewBox="0 0 52 52"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="26" cy="26" r="22" stroke="var(--gold)" strokeWidth="2" />
          <path
            d="M 6 18 C 14 22 38 30 46 34"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M 6 34 C 14 30 38 22 46 18"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>

        <span
          style={{
            fontFamily: "'Bebas Neue', Impact, sans-serif",
            fontSize,
            lineHeight: 1,
            letterSpacing: '0.07em',
            color: textColor,
          }}
        >
          CHRONICLE
        </span>
      </div>

      {/* Era tagline */}
      <div
        className="flex items-center w-full"
        style={{ marginTop: compact ? 3 : 5, gap: 8 }}
      >
        <div style={{ flex: 1, height: 1, background: 'var(--gold)', opacity: 0.55, minWidth: 20 }} />
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: eraSize,
            fontWeight: 500,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: variant === 'dark' ? 'var(--muted)' : 'var(--muted)',
            whiteSpace: 'nowrap',
          }}
        >
          {compact ? '1980 – 2002' : 'Archivio del tennis 1980 – 2002'}
        </span>
        <div style={{ flex: 1, height: 1, background: 'var(--gold)', opacity: 0.55, minWidth: 20 }} />
      </div>
    </Link>
  )
}
