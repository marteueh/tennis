import Link from 'next/link'

export function Footer() {
  return (
    <footer
      style={{
        borderTop: '2px solid #1A1A1A',
        marginTop: 80,
        background: '#FAFAF8',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

          {/* Testata + tagline */}
          <div className="md:col-span-2">
            <Link href="/" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: 16 }}>
              <span
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: '0.03em',
                  color: '#1A1A1A',
                }}
              >
                Ace Chronicle
              </span>
            </Link>
            <p
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontStyle: 'italic',
                fontSize: 14,
                lineHeight: 1.75,
                color: '#7A7870',
                maxWidth: 380,
              }}
            >
              Ogni partita di quei ventitré anni ha una storia che i numeri non raccontano da soli
              e le parole non raccontano senza i numeri. Noi le raccontiamo insieme.
            </p>
          </div>

          {/* Sezioni */}
          <div>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 9,
                fontWeight: 500,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#7A7870',
                marginBottom: 16,
              }}
            >
              Sezioni
            </p>
            <nav className="flex flex-col gap-3">
              {[
                { href: '/partite',          label: 'Partite' },
                { href: '/giocatori',        label: 'Giocatori' },
                { href: '/tornei',           label: 'Tornei' },
                { href: '/la-voce-narrante', label: 'Le Voci Narranti' },
                { href: '/newsletter',       label: 'Newsletter' },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: '#7A7870',
                    textDecoration: 'none',
                  }}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Tornei principali */}
          <div>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 9,
                fontWeight: 500,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#7A7870',
                marginBottom: 16,
              }}
            >
              Grandi Slam
            </p>
            <nav className="flex flex-col gap-3">
              {[
                { href: '/tornei/australian-open', label: 'Australian Open' },
                { href: '/tornei/roland-garros',   label: 'Roland Garros' },
                { href: '/tornei/wimbledon',        label: 'Wimbledon' },
                { href: '/tornei/us-open',          label: 'US Open' },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: '#7A7870',
                    textDecoration: 'none',
                  }}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Attributions */}
        <div
          style={{
            marginTop: 48,
            paddingTop: 24,
            borderTop: '1px solid rgba(26,26,26,0.08)',
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              <>Dati statistici: Jeff Sackmann / Tennis Abstract (CC-BY-NC-SA 4.0) —{' '}
                <a href="https://github.com/JeffSackmann/tennis_atp" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(26,26,26,0.45)' }}>
                  github.com/JeffSackmann/tennis_atp
                </a></>,
              <>Testi: © La Repubblica / GEDI — citazioni per fini culturali ex art. 70 L. 633/1941 ·{' '}
                <a href="https://ricerca.repubblica.it" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(26,26,26,0.45)' }}>
                  ricerca.repubblica.it
                </a></>,
              <>Video: canali YouTube ufficiali US Open (USTA), Australian Open, Roland Garros</>,
            ].map((content, i) => (
              <p key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, lineHeight: 1.7, color: 'rgba(26,26,26,0.35)' }}>
                {content}
              </p>
            ))}
          </div>
          <p style={{ marginTop: 16, fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'rgba(26,26,26,0.25)' }}>
            © {new Date().getFullYear()} Ace Chronicle · Progetto culturale non-commerciale
          </p>
        </div>
      </div>
    </footer>
  )
}
