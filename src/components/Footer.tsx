import Link from 'next/link'
import { Logo } from './Logo'

export function Footer() {
  return (
    <footer
      style={{
        borderTop: '2px solid #1C1A17',
        marginTop: 80,
        background: '#EFE9DB',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

          {/* Testata + tagline */}
          <div className="md:col-span-2">
            <div style={{ marginBottom: 18 }}>
              <Logo variant="paper" />
            </div>
            <p
              style={{
                fontFamily: "'Source Serif 4', serif",
                fontStyle: 'italic',
                fontSize: 14,
                lineHeight: 1.75,
                color: '#7C7568',
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
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 9,
                fontWeight: 500,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#7C7568',
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
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 13,
                    color: '#7C7568',
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
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 9,
                fontWeight: 500,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#7C7568',
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
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 13,
                    color: '#7C7568',
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
            borderTop: '1px solid rgba(28,26,23,0.08)',
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              <>Dati statistici: Jeff Sackmann / Tennis Abstract (CC-BY-NC-SA 4.0) —{' '}
                <a href="https://github.com/JeffSackmann/tennis_atp" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(28,26,23,0.45)' }}>
                  github.com/JeffSackmann/tennis_atp
                </a></>,
              <>Testi: © La Repubblica / GEDI — citazioni per fini culturali ex art. 70 L. 633/1941 ·{' '}
                <a href="https://ricerca.repubblica.it" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(28,26,23,0.45)' }}>
                  ricerca.repubblica.it
                </a></>,
              <>Video: canali YouTube ufficiali US Open (USTA), Australian Open, Roland Garros</>,
            ].map((content, i) => (
              <p key={i} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, lineHeight: 1.7, color: 'rgba(28,26,23,0.35)' }}>
                {content}
              </p>
            ))}
          </div>
          <p style={{ marginTop: 16, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: 'rgba(28,26,23,0.25)' }}>
            © {new Date().getFullYear()} Ace Chronicle · Progetto culturale non-commerciale
          </p>
        </div>
      </div>
    </footer>
  )
}
