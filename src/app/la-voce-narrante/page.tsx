import type { Metadata } from 'next'
import { SectionDivider } from '@/components/SectionDivider'

export const metadata: Metadata = {
  title: 'Le Voci Narranti — Gianni Clerici e Rino Tommasi',
  description:
    'Gianni Clerici e Rino Tommasi, voci storiche del tennis italiano. Bibliografia di Clerici, libri di tennis essenziali e ascolto delle telecronache disponibili.',
}

// ── Bibliografia di Clerici (libri a tema tennistico) ──────────────────
interface Book {
  title: string
  year: number | string
  publisher?: string
  note?: string
}

const CLERICI_BOOKS: Book[] = [
  { title: 'Il grande tennis', year: 1965, publisher: 'Longanesi', note: 'Primo manuale tecnico-narrativo italiano' },
  { title: 'L\'arte del tennis', year: 1968, publisher: 'Longanesi' },
  { title: '500 anni di tennis', year: 1974, publisher: 'Mondadori', note: 'Riedizioni successive 1984, 1989, 2001 — opera fondamentale, storia universale del gioco' },
  { title: 'Il piacere del tennis', year: 1980, publisher: 'Longanesi' },
  { title: 'Wimbledon. Una pittoresca giornata di sport', year: 1995, publisher: 'Baldini & Castoldi' },
  { title: 'Suzanne Lenglen. La diva del tennis', year: 2002, publisher: 'Corbaccio', note: 'Romanzo biografico, vincitore Premio Bagutta' },
  { title: 'La passione del tennis', year: 2010, publisher: 'Baldini Castoldi Dalai' },
  { title: 'Cronache di tennis', year: 2013, publisher: 'Mondadori', note: 'Antologia di articoli su La Repubblica' },
  { title: 'Ricordi imperfetti', year: 2014, publisher: 'Mondadori', note: 'Autobiografia' },
  { title: 'Divinità alate', year: 2018, publisher: '66thand2nd' },
]

// ── Bibliografia estesa (altri libri a tema tennistico) ────────────────
const TENNIS_BOOKS: Book[] = [
  { title: 'Open. La mia storia', year: 2009, publisher: 'Einaudi', note: 'Andre Agassi — autobiografia capolavoro' },
  { title: 'You Cannot Be Serious', year: 2002, publisher: 'Putnam', note: 'John McEnroe — autobiografia' },
  { title: 'A Champion\'s Mind', year: 2008, publisher: 'Crown', note: 'Pete Sampras' },
  { title: 'Vincere è sempre questione di testa', year: 1993, publisher: 'Sperling & Kupfer', note: 'Brad Gilbert — Winning Ugly, manuale di tattica' },
  { title: 'Levels of the Game', year: 1969, publisher: 'Farrar', note: 'John McPhee — Ashe vs Graebner, US Open 1968. Reportage iconico' },
  { title: 'A Terrible Splendor', year: 2009, publisher: 'Crown', note: 'Marshall Jon Fisher — Cramm vs Budge 1937, romanzo storico' },
  { title: 'Tennis. Romanzo di un campione', year: 2013, publisher: 'Rizzoli', note: 'David Foster Wallace — saggi su Federer e Tracy Austin' },
  { title: 'Il tennis come esperienza religiosa', year: 2012, publisher: 'Einaudi', note: 'David Foster Wallace — l\'estasi del gioco' },
  { title: 'L\'Italia del tennis', year: 2010, publisher: 'Le Lettere', note: 'Daniele Marchesini — storia del tennis italiano' },
  { title: 'Mille tennis', year: 2008, publisher: 'Mondadori', note: 'Rino Tommasi — il compagno di telecronaca di Clerici' },
  { title: 'Sport e fascismo', year: 2002, publisher: 'Marsilio', note: 'Felice Fabrizio — capitoli sul tennis italiano d\'epoca' },
  { title: 'The Right Set', year: 1999, publisher: 'Vintage', note: 'Caryl Phillips (ed.) — antologia letteraria internazionale sul tennis' },
  { title: 'String Theory', year: 2016, publisher: 'Library of America', note: 'David Foster Wallace — raccolta saggi tennis' },
]

export default function LaVoceNarrantePage() {
  return (
    <>
      {/* Hero — tipografico-editoriale */}
      <section
        style={{
          background: '#1C1A17',
          padding: '72px 0 64px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div className="hero-grid" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

        {/* Watermark virgolette */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: '-2%',
            top: '50%',
            transform: 'translateY(-50%)',
            fontFamily: "'Source Serif 4', serif",
            fontSize: 'clamp(200px, 28vw, 420px)',
            color: 'rgba(156,124,62,0.06)',
            lineHeight: 0.8,
            userSelect: 'none',
            fontWeight: 700,
          }}
        >
          „
        </div>

        <div className="max-w-7xl mx-auto px-6" style={{ position: 'relative', zIndex: 1 }}>
          <p
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: '#9C7C3E', marginBottom: 18,
              display: 'flex', alignItems: 'center', gap: 10,
            }}
          >
            <span style={{ display: 'inline-block', width: 24, height: 1, background: '#9C7C3E' }} />
            Le voci narranti
          </p>

          {/* Coppia di nomi con epiteti */}
          <div
            style={{
              gap: 'clamp(24px, 6vw, 80px)',
              alignItems: 'baseline',
              marginBottom: 32,
            }}
            className="grid grid-cols-1 md:grid-cols-[auto_auto]"
          >
            <NameBlock
              name="Gianni Clerici"
              years="1930–2021"
              epithet="il poeta"
              quote="Il rovescio è un colpo d&#39;astrazione."
              attrib="—  Gianni Clerici, 500 anni di tennis"
            />
            <NameBlock
              name="Rino Tommasi"
              years="1934–2025"
              epithet="il computer"
              quote="Ogni grande partita merita il suo circoletto rosso."
              attrib="—  Rino Tommasi, formula iconica delle sue telecronache"
            />
          </div>

          <p
            style={{
              fontFamily: "'Source Serif 4', serif",
              fontStyle: 'italic',
              fontSize: 'clamp(15px, 1.6vw, 17px)',
              lineHeight: 1.75,
              color: 'rgba(255,255,255,0.55)',
              maxWidth: 760,
              borderLeft: '3px solid #B54A2C',
              paddingLeft: 18,
            }}
          >
            Per quarant&#39;anni il tennis italiano in TV ha avuto due voci sole, due nomi
            che si succedevano come un controcanto: il letterato e lo statistico. Ace Chronicle
            conserva la loro telecronaca laddove la rete la rende ancora ascoltabile, e li
            ricorda con la loro biblioteca.
          </p>
        </div>
      </section>

      {/* Contenuto principale */}
      <div className="max-w-7xl mx-auto px-6 py-12">

        {/* Clerici + Tommasi */}
        <div
          style={{ gap: 48, marginBottom: 56 }}
          className="grid grid-cols-1 md:grid-cols-2"
        >
          {/* Clerici */}
          <div>
            <SectionLabel>Il cronista</SectionLabel>
            <h2 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 26, color: '#1C1A17', marginBottom: 16, lineHeight: 1.2 }}>
              Gianni Clerici (1930–2021)
            </h2>
            <p style={paragraphStyle}>
              Giocatore, scrittore e giornalista, Clerici è considerato il più grande cronista
              di tennis della storia italiana. Ha coperto Wimbledon per oltre cinquant&#39;anni
              come corrispondente de La Repubblica. Ha inventato un linguaggio che definiva
              le azioni di gioco con la precisione del tecnico e la grazia del letterato.
            </p>
            <p style={paragraphStyle}>
              Sui campi dal 1980 al 2002 era presente ogni volta che la storia si faceva.
              I suoi articoli sono ricercabili nell&#39;archivio digitale de La Repubblica su{' '}
              <a href="https://ricerca.repubblica.it" target="_blank" rel="noopener noreferrer" style={{ color: '#B54A2C' }}>
                ricerca.repubblica.it
              </a>.
            </p>
            <p style={paragraphStyle}>
              Nel 2022, l&#39;Università del Piemonte Orientale ha istituito il{' '}
              <strong>Fondo Gianni Clerici</strong>, donato dalla famiglia: oltre ottomila
              volumi, manoscritti, corrispondenza e l&#39;archivio personale dello scrittore.
              Custodito presso la Biblioteca di Vercelli, è una risorsa aperta a studiosi
              e appassionati di letteratura sportiva.
            </p>
          </div>

          {/* Tommasi */}
          <div>
            <SectionLabel>Il computer</SectionLabel>
            <h2 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 26, color: '#1C1A17', marginBottom: 16, lineHeight: 1.2 }}>
              Rino Tommasi (1934–2025)
            </h2>
            <p style={paragraphStyle}>
              Giornalista, statistico, organizzatore, voce di Tele+ e Sky Sport. Tommasi
              ha condiviso con Clerici la cabina di telecronaca per quattro decenni, dagli
              anni di Tele+ Tennis ai successi del duo su Sky. Il loro sodalizio professionale
              è uno dei più longevi e iconici del giornalismo sportivo italiano: la cifra
              del cronista — numeri, head-to-head, statistiche in tempo reale —
              affiancata alla cifra del letterato.
            </p>
            <p style={paragraphStyle}>
              Una coppia che ha educato generazioni di telespettatori italiani al tennis,
              trasformando ogni telecronaca in un dialogo tra due saperi complementari.
            </p>

            <div
              style={{
                marginTop: 20,
                background: 'rgba(181,74,44,0.05)',
                border: '1px solid rgba(181,74,44,0.15)',
                borderLeft: '3px solid #B54A2C',
                padding: '16px 18px',
                borderRadius: '0 2px 2px 0',
              }}
            >
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, lineHeight: 1.7, color: '#1C1A17' }}>
                <strong>Su Ace Chronicle:</strong> dove possibile, alle schede partita
                affianchiamo la versione con la telecronaca di Tommasi e Clerici accanto
                a quella originale. Un toggle sopra il player permette di scegliere
                quale voce ascoltare. Le clip provengono da archivi non ufficiali su
                YouTube — finché restano online, sono qui.
              </p>
            </div>
          </div>
        </div>

        <SectionDivider />

        {/* Bibliografia Clerici */}
        <div style={{ marginBottom: 56 }}>
          <SectionLabel>Bibliografia di Clerici</SectionLabel>
          <h2 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 28, color: '#1C1A17', marginBottom: 8 }}>
            I libri di tennis di Gianni Clerici
          </h2>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, lineHeight: 1.7, color: '#7C7568', marginBottom: 28, maxWidth: 720 }}>
            Da <em>Il grande tennis</em> del 1965 a <em>Divinità alate</em>, una sintesi
            di un&#39;opera che ha fondato la letteratura sportiva italiana sul gioco.
          </p>
          <BookList books={CLERICI_BOOKS} accent="#B54A2C" />
        </div>

        <SectionDivider />

        {/* Bibliografia estesa */}
        <div style={{ marginBottom: 40 }}>
          <SectionLabel>Bibliografia estesa</SectionLabel>
          <h2 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 28, color: '#1C1A17', marginBottom: 8 }}>
            Altri libri sul tennis
          </h2>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, lineHeight: 1.7, color: '#7C7568', marginBottom: 28, maxWidth: 720 }}>
            Una selezione di autobiografie, reportage e saggistica che ha contribuito
            a costruire la cultura del gioco — dai grandi classici americani alle
            voci italiane oltre Clerici.
          </p>
          <BookList books={TENNIS_BOOKS} accent="#9C7C3E" />
        </div>

        <SectionDivider />

        {/* Attribuzione */}
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, lineHeight: 1.7, color: 'rgba(28,26,23,0.45)' }}>
            Ace Chronicle utilizza estratti brevi degli articoli di Gianni Clerici su La Repubblica
            con attribuzione completa, rimandando sempre alla fonte originale.
          </p>
          <p style={{ marginTop: 8, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: 'rgba(28,26,23,0.3)' }}>
            © La Repubblica / GEDI — riproduzione parziale per fini culturali ex art. 70 L. 633/1941
          </p>
        </div>
      </div>
    </>
  )
}

// ── Componenti riusabili ────────────────────────────────────────────────

function NameBlock({ name, years, epithet, quote, attrib }: {
  name: string
  years: string
  epithet: string
  quote: string
  attrib: string
}) {
  return (
    <div>
      <p style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase',
        color: '#9C7C3E', marginBottom: 6,
      }}>
        {epithet}
      </p>
      <h2 style={{
        fontFamily: "'Source Serif 4', serif",
        fontSize: 'clamp(28px, 4vw, 44px)',
        lineHeight: 1.05,
        color: '#FFFFFF',
        marginBottom: 4,
      }}>
        {name}
      </h2>
      <p style={{
        fontFamily: "'Source Serif 4', Georgia, serif",
        fontSize: 13,
        letterSpacing: '0.08em',
        color: 'rgba(255,255,255,0.45)',
        marginBottom: 18,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {years}
      </p>
      <blockquote style={{
        margin: 0,
        fontFamily: "'Source Serif 4', serif",
        fontStyle: 'italic',
        fontSize: 14,
        lineHeight: 1.6,
        color: 'rgba(255,255,255,0.75)',
      }}>
        «{quote}»
      </blockquote>
      <p style={{
        marginTop: 6,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: 11, letterSpacing: '0.04em',
        color: 'rgba(255,255,255,0.3)',
      }}>
        {attrib}
      </p>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: 10, fontWeight: 500, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: '#7C7568',
        marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8,
      }}
    >
      <span style={{ display: 'inline-block', width: 20, height: 1, background: '#7C7568', opacity: 0.4 }} />
      {children}
    </p>
  )
}

function BookList({ books, accent }: { books: Book[]; accent: string }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
        gap: 10,
      }}
    >
      {books.map((b, i) => (
        <article
          key={i}
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(28,26,23,0.07)',
            borderLeft: `3px solid ${accent}`,
            borderRadius: '0 2px 2px 0',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
            <h3
              style={{
                fontFamily: "'Source Serif 4', serif",
                fontSize: 15, color: '#1C1A17', lineHeight: 1.3, flex: 1,
              }}
            >
              {b.title}
            </h3>
            <span
              style={{
                fontFamily: "'Source Serif 4', Georgia, serif",
                fontSize: 13, color: accent, flexShrink: 0,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {b.year}
            </span>
          </div>
          {b.publisher && (
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: '#7C7568', fontStyle: 'italic' }}>
              {b.publisher}
            </p>
          )}
          {b.note && (
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: '#1C1A17', lineHeight: 1.5, marginTop: 4 }}>
              {b.note}
            </p>
          )}
        </article>
      ))}
    </div>
  )
}

const paragraphStyle: React.CSSProperties = {
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: 14, lineHeight: 1.75, color: '#1C1A17', marginBottom: 12,
}
