# Ace Chronicle — Brief completo per Claude Code

> Documento operativo per la realizzazione del sito. Contiene tutto il necessario per costruire, lanciare e gestire il progetto nella fase 1 non-commerciale.

---

## 1. Concept e posizionamento

### Cos'è Ace Chronicle

Ace Chronicle è un archivio editoriale del tennis degli anni '90 (1985–2000) che unisce:
- **Statistiche complete** da fonti open (dataset Jeff Sackmann)
- **Video storici** embedati dai canali YouTube ufficiali degli Slam
- **Narrazione letteraria** — link agli articoli di Gianni Clerici dal portale "Lo Scriba del Tennis" (Università Cattolica Brescia)

Non è un sito sportivo. È un progetto culturale che usa il dato come punto di partenza per raccontare un'epoca.

### Brand promise

> "Ogni partita degli anni '90 ha una storia che i numeri non raccontano da soli e le parole non raccontano senza i numeri. Noi le raccontiamo insieme."

### Posizionamento

| Non è | È |
|---|---|
| Sito di news sportive | Archivio editoriale permanente |
| Enciclopedia neutrale | Archivio con punto di vista |
| Fan site | Pubblicazione culturale |
| Dashboard di statistiche | Dato + narrazione integrati |

### Pubblico target

1. **Il testimone** (40–60 anni) — ha visto quelle partite in diretta, cerca un luogo che custodisca la sua memoria con cura
2. **Il curioso** (25–40 anni) — ama il tennis ma non ha vissuto gli anni '90, vuole capire perché tutti ne parlano come di un'epoca irripetibile
3. **L'analista** (qualsiasi età) — appassionato di dati sportivi, ricercatori, giornalisti

### Tono di voce

- Colto senza essere accademico
- Appassionato senza essere fan
- Preciso senza essere freddo
- Nostalgico senza essere malinconico

**Non è mai:** sensazionalistico, superlativo, promozionale, neutro come Wikipedia, urlato come i social sportivi.

---

## 2. Naming e dominio

**Nome:** Ace Chronicle  
**Dominio consigliato:** `acechronicle.com`  
**Alternativa italiana:** `gestibianchi.it` (omaggio diretto a Clerici, solo per mercato IT)

---

## 3. Design system

### Filosofia visiva

Estetica editoriale tipografica — carta stampata di qualità, non schermo sportivo. Riferimento visivo: Il Post, The Athletic nelle pagine dati. Design-first: nessuna dipendenza da fotografie d'agenzia.

### Palette colori

```css
--paper:   #F5F2EB;  /* background principale — bianco caldo */
--ink:     #1A1A1A;  /* testo primario */
--accent:  #534AB7;  /* viola — unico colore brand */
--gold:    #C8A85C;  /* oro — solo per elementi "speciali" (record, titoli) */
--coral:   #D84F2E;  /* accento caldo — uso sparso */
--muted:   #7A7870;  /* testo secondario */
--border:  rgba(26,26,26,0.10); /* bordi sottili */
--surface: #FFFFFF;  /* card e superfici elevate */
```

**Regole colore:**
- Il viola `#534AB7` è l'unico accent — mai rosso, verde, arancio per link o CTA
- L'oro solo per record, titoli, partite iconiche — mai come colore decorativo generico
- Il background è `#F5F2EB` (carta calda), non bianco puro
- **Niente nero come colore dominante di sezioni** — usare nero solo per la navbar e elementi puntuali

### Tipografia

```
Display / Titoli:  DM Serif Display (Google Fonts) — serif per autorevolezza editoriale
UI / Corpo:        DM Sans (Google Fonts) — sans-serif pulito
Numeri grandi:     Bebas Neue (Google Fonts) — per statistiche, punteggi, ranking
Mono / Dati:       font-variant-numeric: tabular-nums su DM Sans
```

**Coppie tipografiche:**
- Titoli narrativi → DM Serif Display (anche corsivo per enfasi)
- Statistiche e numeri prominenti → Bebas Neue
- Navigazione, body, label → DM Sans
- Mai Arial, Inter, Roboto, system fonts

**Scale tipografica:**
```
Hero title:     38–42px / DM Serif Display / line-height 1.1
Section title:  24–28px / DM Serif Display
Card title:     15–17px / DM Serif Display
Body:           13–14px / DM Sans / line-height 1.7
Label/Tag:      10px / DM Sans 500 / uppercase / letter-spacing .1em
Stat number:    20–32px / Bebas Neue
```

### Elementi grafici di brand

1. **Griglia di linee sottili** — `background-image: linear-gradient(...)` a 32–40px, opacity 3–5% — nelle hero section su sfondo scuro
2. **Anno in sovrimpressione** — Bebas Neue grande (80–100px), opacity 4–5%, colore bianco o carta — elemento decorativo nelle hero
3. **Divisore a tre righe** — linea nera 3px con segmento viola al centro — separa sezioni principali
4. **Numerazione partite** — Bebas Neue 28px, opacity 12% — diventa viola al hover
5. **Tag uppercase** — `font-size: 10px / letter-spacing: .1em / text-transform: uppercase` con `::before` linea decorativa

### Hero section — fotografie free da usare

**Fonte primaria:** Library of Congress — [loc.gov/free-to-use/tennis](https://www.loc.gov/free-to-use/tennis/)  
Raccolta "Free to Use and Reuse: Tennis" — immagini rights-free, nessuna restrizione.  
Immagini disponibili: Forest Hills, campi storici, tribune, atmosfera d'epoca.

**Fonte secondaria:** Fondo Clerici — [brescia-raccoltestoriche-gianniclerici.unicatt.it](https://brescia-raccoltestoriche-gianniclerici.unicatt.it)  
1.725 fotografie digitalizzate. Download libero con citazione della fonte.  
Attribuzione richiesta: `© Fondo Gianni Clerici — Università Cattolica del Sacro Cuore, Brescia`

**Uso consigliato:**
- Le foto non vanno usate come hero fotografici in primo piano (qualità insufficiente per gli anni '90)
- Usarle come **texture di sfondo** a bassa opacità (10–20%) con overlay color carta o inchiostro
- Abbinare sempre un elemento tipografico dominante sopra la foto
- Evitare di mostrare i giocatori — le foto disponibili sono di campi e atmosfere, non di action shots

### Componenti chiave

**Navbar:**
```
Background: var(--ink) nero
Logo: Bebas Neue — "ACE · CHRONICLE" con il punto in var(--accent)
Link: DM Sans 11px, colore rgba(255,255,255,.55)
CTA: background var(--accent), testo bianco, border-radius 2px
Bordo inferiore: 2px solid var(--accent)
```

**Score card (scheda partita):**
```
Background vincitore: rgba(83,74,183,.12) — tinta viola leggera
Nome vincitore: Bebas Neue, color var(--accent)
Set vinti: Bebas Neue 22px, color var(--ink)
Set persi: Bebas Neue 22px, color rgba(26,26,26,.25)
```

**Barre statistiche:**
```
Altezza: 3px, border-radius: 1.5px
Colore vincitore: var(--accent)
Colore perdente: rgba(26,26,26,.2)
Divider centrale: 0.5px var(--border)
```

**Card info (aside):**
```
Header: background var(--ink), Bebas Neue 12px, letter-spacing 1.5px, colore rgba(255,255,255,.6)
Righe: DM Sans 12px, chiave var(--muted), valore var(--ink) 500
```

**Citazione Clerici:**
```
Font: DM Serif Display italic 14px, line-height 1.75
Border-left: 3px solid var(--accent)
Padding-left: 16px
Monogramma autore: background var(--ink), colore var(--accent), serif italic
```

---

## 4. Architettura tecnica

### Stack

| Layer | Tecnologia | Note |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR per SEO, routing file-based |
| Deploy | Vercel | Tier free, deploy automatico da GitHub |
| Database | Supabase (PostgreSQL) | Tier free 500MB, REST API auto-generata |
| Styling | Tailwind CSS | Utility-first, configurato con i token del design system |
| Newsletter | Beehiiv | Tier free fino a 2.500 subscriber, API per form embed |
| Analytics | Google Tag Manager + GA4 | Proprietà nuova nell'account GA4 esistente |
| Font | Google Fonts | DM Serif Display, DM Sans, Bebas Neue |

### Struttura pagine e routing

```
/                          → Homepage
/partite                   → Lista partite con filtri (anno, torneo, giocatore, superficie)
/partite/[slug]            → Scheda partita singola
/giocatori                 → Lista giocatori
/giocatori/[slug]          → Profilo giocatore con career stats
/tornei                    → Lista tornei
/tornei/[slug]             → Pagina torneo con storico per anno
/tornei/[slug]/[anno]      → Tabellone completo di un torneo in un anno specifico
/la-voce-narrante          → Sezione dedicata agli articoli Clerici linkati alle partite
/newsletter                → Pagina dedicata alla newsletter con archivio edizioni
```

**Slug convention:**
```
Partite:    sampras-agassi-us-open-1995-finale
Giocatori:  pete-sampras
Tornei:     us-open
```

### SEO — meta tag per ogni pagina

```
Homepage:
  title: "Ace Chronicle — Tennis anni '90: statistiche, video e narrazione"
  description: "Archivio completo del tennis 1985–2000. Statistiche, video storici e la voce di Gianni Clerici su ogni partita."

Scheda partita:
  title: "Sampras b. Agassi 6-4 6-3 4-6 7-5 | Finale US Open 1995 | Ace Chronicle"
  description: "Statistiche complete, video integrale e la cronaca di Gianni Clerici della finale US Open 1995 tra Pete Sampras e Andre Agassi."

Profilo giocatore:
  title: "Pete Sampras — Career stats 1988–2003 | Ace Chronicle"
```

**Open Graph:** immagine OG generata dinamicamente con Vercel OG — sfondo carta con nome giocatori in Bebas Neue e punteggio.

---

## 5. Schema database (Supabase / PostgreSQL)

### Tabella `players`

```sql
CREATE TABLE players (
  id            SERIAL PRIMARY KEY,
  sackmann_id   INTEGER UNIQUE,        -- ID del dataset Sackmann
  slug          TEXT UNIQUE NOT NULL,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  country_code  CHAR(3),
  hand          CHAR(1),               -- R / L
  birth_date    DATE,
  height_cm     INTEGER,
  atp_peak_rank INTEGER,
  grand_slams   INTEGER DEFAULT 0,
  active_from   INTEGER,               -- anno
  active_to     INTEGER,               -- anno
  bio_it        TEXT,                  -- testo editoriale italiano
  bio_en        TEXT,
  clerici_url   TEXT                   -- link sezione giocatore su portale Cattolica
);
```

### Tabella `tournaments`

```sql
CREATE TABLE tournaments (
  id            SERIAL PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  name_it       TEXT,
  surface       TEXT,                  -- Hard / Clay / Grass / Carpet
  category      TEXT,                  -- GrandSlam / Masters / ATP500 / ATP250
  country_code  CHAR(3),
  city          TEXT
);
```

### Tabella `matches`

```sql
CREATE TABLE matches (
  id              SERIAL PRIMARY KEY,
  sackmann_id     TEXT UNIQUE,         -- ID partita dataset Sackmann
  slug            TEXT UNIQUE NOT NULL,
  tournament_id   INTEGER REFERENCES tournaments(id),
  year            SMALLINT NOT NULL,
  match_date      DATE,
  round           TEXT,                -- F / SF / QF / R16 / R32 / R64 / R128
  surface         TEXT,
  winner_id       INTEGER REFERENCES players(id),
  loser_id        INTEGER REFERENCES players(id),
  winner_rank     SMALLINT,
  loser_rank      SMALLINT,
  score           TEXT,                -- es. "6-4 6-3 4-6 7-5"
  duration_min    SMALLINT,

  -- Statistiche servizio vincitore
  w_ace           SMALLINT,
  w_df            SMALLINT,
  w_svpt          SMALLINT,
  w_1stIn         SMALLINT,
  w_1stWon        SMALLINT,
  w_2ndWon        SMALLINT,
  w_SvGms         SMALLINT,
  w_bpSaved       SMALLINT,
  w_bpFaced       SMALLINT,

  -- Statistiche servizio perdente
  l_ace           SMALLINT,
  l_df            SMALLINT,
  l_svpt          SMALLINT,
  l_1stIn         SMALLINT,
  l_1stWon        SMALLINT,
  l_2ndWon        SMALLINT,
  l_SvGms         SMALLINT,
  l_bpSaved       SMALLINT,
  l_bpFaced       SMALLINT,

  -- Contenuto editoriale
  youtube_video_id    TEXT,            -- videoId YouTube (es. "wTNvz2F682k")
  youtube_channel     TEXT,            -- es. "USTA", "AustralianOpen"
  youtube_verified_at TIMESTAMPTZ,    -- ultima verifica che il video esiste ancora
  clerici_article_url TEXT,            -- URL diretto articolo portale Cattolica
  clerici_excerpt_it  TEXT,            -- estratto breve (max 300 chars) con attribuzione
  editorial_note_it   TEXT,            -- nota editoriale interna (max 500 chars)
  featured            BOOLEAN DEFAULT false,
  featured_week       DATE             -- settimana in cui è stata "partita in evidenza"
);

CREATE INDEX idx_matches_year ON matches(year);
CREATE INDEX idx_matches_tournament ON matches(tournament_id);
CREATE INDEX idx_matches_winner ON matches(winner_id);
CREATE INDEX idx_matches_loser ON matches(loser_id);
CREATE INDEX idx_matches_featured ON matches(featured) WHERE featured = true;
```

### Tabella `rankings`

```sql
CREATE TABLE rankings (
  id          SERIAL PRIMARY KEY,
  player_id   INTEGER REFERENCES players(id),
  rank_date   DATE NOT NULL,
  rank        SMALLINT NOT NULL,
  rank_points INTEGER
);

CREATE INDEX idx_rankings_player ON rankings(player_id);
CREATE INDEX idx_rankings_date ON rankings(rank_date);
```

### Import dati Sackmann

Script Python da eseguire una tantum:

```python
# import_sackmann.py
import pandas as pd
from supabase import create_client

SUPABASE_URL = "..."
SUPABASE_KEY = "..."
YEARS = range(1985, 2001)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

for year in YEARS:
    url = f"https://raw.githubusercontent.com/JeffSackmann/tennis_atp/master/atp_matches_{year}.csv"
    df = pd.read_csv(url)
    # mapping colonne Sackmann → schema Supabase
    # [vedere README Sackmann per dizionario colonne]
    records = df.to_dict(orient='records')
    supabase.table('matches').upsert(records).execute()
    print(f"Anno {year}: {len(records)} partite importate")
```

**Attribuzione obbligatoria nel footer del sito:**
```
Dati statistici: Jeff Sackmann / Tennis Abstract (CC-BY-NC-SA 4.0)
github.com/JeffSackmann/tennis_atp
```

---

## 6. Logica matching YouTube

### Cron job settimanale (Vercel Cron)

```typescript
// app/api/cron/youtube-match/route.ts
// Eseguito ogni lunedì alle 03:00

import { createClient } from '@supabase/supabase-js'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const OFFICIAL_CHANNELS = {
  'us-open':        'UCkBSdkMpwSdJNRQb5aRkJwA', // USTA
  'australian-open':'UCMKoSCkD0gMi1HYbZ5ZtLnQ',
  'roland-garros':  'UCkBSdkMpwSdJNRQb5aRkJwA', // Roland Garros ufficiale
  // Wimbledon: nessun video d'archivio disponibile
}

async function searchMatchVideo(match: Match): Promise<string | null> {
  const query = `${match.winner_name} ${match.loser_name} ${match.tournament_name} ${match.year}`
  const channelId = OFFICIAL_CHANNELS[match.tournament_slug]
  if (!channelId) return null

  const url = `https://www.googleapis.com/youtube/v3/search?` +
    `part=snippet&q=${encodeURIComponent(query)}&channelId=${channelId}` +
    `&type=video&maxResults=3&key=${YOUTUBE_API_KEY}`

  const res = await fetch(url)
  const data = await res.json()

  if (data.items?.length > 0) {
    return data.items[0].id.videoId
  }
  return null
}
```

### Verifica periodica video rimossi

```typescript
// Controlla ogni settimana se i video esistono ancora
async function verifyVideoExists(videoId: string): Promise<boolean> {
  const url = `https://www.googleapis.com/youtube/v3/videos?` +
    `part=id&id=${videoId}&key=${YOUTUBE_API_KEY}`
  const res = await fetch(url)
  const data = await res.json()
  return data.items?.length > 0
}
```

### Embed nel componente React

```tsx
// components/MatchVideo.tsx
export function MatchVideo({ videoId, title }: { videoId: string | null, title: string }) {
  if (!videoId) {
    return (
      <div className="video-unavailable">
        <p>Video non disponibile per questa partita</p>
        <p className="hint">I canali ufficiali degli Slam rilasciano progressivamente i propri archivi su YouTube</p>
      </div>
    )
  }

  return (
    <div className="video-wrapper">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
      <p className="video-attribution">
        Video: canale YouTube ufficiale · embedato tramite YouTube IFrame API
      </p>
    </div>
  )
}
```

---

## 7. Sezione "La voce narrante" — integrazione Clerici

### Logica di collegamento

Il portale dell'Università Cattolica Brescia ([brescia-raccoltestoriche-gianniclerici.unicatt.it](https://brescia-raccoltestoriche-gianniclerici.unicatt.it)) pubblica gli articoli di Clerici con download libero e citazione della fonte.

**Modello di integrazione:**
1. Il campo `clerici_article_url` nella tabella `matches` contiene il link diretto all'articolo sul portale Cattolica
2. Il campo `clerici_excerpt_it` contiene un estratto brevissimo (max 300 caratteri) con attribuzione
3. La scheda partita mostra l'estratto con link "Leggi l'articolo completo →" che apre il portale in nuova tab

**Attribuzione obbligatoria:**
```
Gianni Clerici — [testata] · [data]
Archivio: Lo Scriba del Tennis · Università Cattolica del Sacro Cuore, Brescia
brescia-raccoltestoriche-gianniclerici.unicatt.it
```

**Componente React:**
```tsx
// components/ClericiVoice.tsx
export function ClericiVoice({ excerpt, articleUrl, publication, date }: ClericiProps) {
  return (
    <div className="clerici-section">
      <div className="clerici-header">
        <div className="clerici-monogram">GC</div>
        <div>
          <p className="clerici-name">Gianni Clerici</p>
          <p className="clerici-pub">{publication} · {date}</p>
        </div>
      </div>
      {excerpt && (
        <blockquote className="clerici-quote">"{excerpt}"</blockquote>
      )}
      <a href={articleUrl} target="_blank" rel="noopener noreferrer" className="clerici-link">
        Leggi l'articolo completo su Lo Scriba del Tennis →
      </a>
      <p className="clerici-attribution">
        Archivio Gianni Clerici · Università Cattolica del Sacro Cuore, Brescia
      </p>
    </div>
  )
}
```

---

## 8. Piano editoriale social

### Canali e obiettivi

| Canale | Obiettivo primario | Tono | Frequenza |
|---|---|---|---|
| **Instagram** | Visual storytelling, nostalgia, nuovi utenti | Evocativo, caldo | 4–5 post/settimana |
| **X / Twitter** | Statistiche, dibattito, link articoli | Preciso, puntuale | 1–2 post/giorno |
| **Facebook** | Community over 40, condivisione newsletter | Narrativo, accessibile | 3–4 post/settimana |

---

### Instagram

**Formato principale: la "stat card"**
- Sfondo carta `#F5F2EB` con elemento grafico
- Numero grande in Bebas Neue (colore viola o oro)
- Titolo in DM Serif Display
- Logo Ace Chronicle in basso

**Tipi di contenuto:**

1. **Stat della settimana** (lunedì)
   - Una statistica sorprendente degli anni '90
   - Esempio: "Pete Sampras ha servito 1.011 ace nel solo 1995"
   - Formato: card 1:1 con numero enorme

2. **Partita in evidenza** (mercoledì)
   - Punteggio della partita della newsletter
   - Link in bio al sito
   - Formato: card 4:5 con titolo narrativo

3. **Il dato e la parola** (venerdì)
   - Statistica + estratto Clerici sulla stessa partita
   - Formato: carosello 2 slide (numero / citazione)

4. **Throwback domenicale** (domenica)
   - "Questa settimana nel tennis — [anno]"
   - Partite giocate in quella stessa settimana nei '90
   - Formato: card o reel breve

**Hashtag fissi:**
```
#AceChronicle #Tennis90s #TennisHistory #ComputeRino #GianniClerici
#GrandSlam #ClassicTennis #TennisArchive #GestiBlanche
```

---

### X / Twitter

**Tipologie di post:**

1. **Stat atomica** (mattina, lunedì / mercoledì / venerdì)
   ```
   Pete Sampras a Wimbledon anni '90:
   
   Percentuale prima di servizio media: 71%
   Punti vinti con la prima: 79%
   Ace per match in finale: 14
   
   Non si serviva. Si eseguiva.
   
   acechronicle.com/giocatori/pete-sampras
   ```

2. **Link newsletter** (ogni martedì, giorno dell'invio)
   ```
   Questa settimana su Ace Chronicle:
   Agassi b. Sampras, Australian Open 1995
   Da 0-2 set a campione.
   La rimonta che cambiò una rivalità.
   
   → [link newsletter]
   ```

3. **Domanda alla community** (giovedì)
   ```
   La finale più grande degli anni '90?
   
   □ Sampras–Ivanisevic Wimbledon 2001
   □ Agassi–Courier RG 1991  
   □ Sampras–Agassi US Open 1995
   □ Becker–Edberg Wimbledon 1988
   ```

4. **Thread storico** (una volta a settimana)
   Thread di 5–8 tweet che racconta una rivalità, un torneo o una stagione con dati e narrazione. Formato: primo tweet gancio + dati progressivi + link finale al sito.

---

### Facebook

**Tipologie di contenuto:**

1. **Post narrativo lungo** (lunedì)
   - Racconto completo della partita della settimana
   - 300–500 parole, tono accessibile
   - Link al sito

2. **Condivisione newsletter** (martedì)
   - Preview della newsletter con invito all'iscrizione

3. **Domanda alla community** (giovedì)
   - Domanda aperta ai fan over 40: "Dove eravate quando..."
   - Funziona bene per il target nostalgia

4. **Reel / video** (sabato)
   - Clip breve da YouTube (embed, non download) con didascalia narrativa

**Note Facebook:**
- Tono più conversazionale rispetto a Instagram e X
- Privilegiare post che invitano alla condivisione personale ("Dove eravate quando Agassi vinse il Roland Garros 1999?")
- Evitare linguaggio tecnico — spiegare sempre i termini ("break point" = palla per cambiare il servizio)

---

### Calendario tipo settimanale

| Giorno | Newsletter | Instagram | X / Twitter | Facebook |
|---|---|---|---|---|
| Lunedì | — | Stat della settimana | Stat atomica | Post narrativo |
| Martedì | **Invio newsletter** | — | Link newsletter | Condivisione newsletter |
| Mercoledì | — | Partita in evidenza | Stat atomica | — |
| Giovedì | — | — | Domanda community | Domanda community |
| Venerdì | — | Il dato e la parola | Stat atomica | — |
| Sabato | — | — | — | Reel / clip YouTube |
| Domenica | — | Throwback | Thread storico | — |

---

### Voce editoriale sui social

**Formule da usare:**
- "Nel [anno], [fatto]." — incipit semplice e diretto
- "[Numero]. Non [cosa ovvia]. [Cosa vera]." — struttura tesi/antitesi
- "Clerici scrisse: '[estratto]'" — citazione come ancora narrativa
- "La statistica che nessuno ricorda:" — gancio per dati sorprendenti

**Formule da evitare:**
- "Incredibile!", "Leggendario!", "Epico!" — superlativo vuoto
- "Non crederete mai a..." — clickbait
- Domande retoriche generiche ("Chi ricorda?")

---

## 9. Google Tag Manager — Configurazione completa

### Setup iniziale

**Passo 1 — Nuova proprietà GA4:**
1. Accedere a [analytics.google.com](https://analytics.google.com) con l'account esistente
2. Admin → Crea proprietà → Nome: "Ace Chronicle" → Fuso orario: Europa/Roma → Valuta: EUR
3. Flusso di dati web → URL: acechronicle.com → Nome: "Ace Chronicle Web"
4. Copiare il **Measurement ID** (formato: `G-XXXXXXXXXX`)

**Passo 2 — Container GTM:**
1. Accedere a [tagmanager.google.com](https://tagmanager.google.com)
2. Crea account → Nome account: "Ace Chronicle" → Nome container: "acechronicle.com" → Tipo: Web
3. Copiare il **Container ID** (formato: `GTM-XXXXXXX`)
4. Installare lo snippet GTM in `<head>` e `<body>` del layout Next.js:

```tsx
// app/layout.tsx
import Script from 'next/script'

const GTM_ID = 'GTM-XXXXXXX'

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script id="gtm-head" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
      </head>
      <body>
        <noscript>
          <iframe src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0" width="0" style={{display:'none',visibility:'hidden'}}/>
        </noscript>
        {children}
      </body>
    </html>
  )
}
```

---

### Tag: GA4 Configuration

**In GTM → Tag → Nuovo:**
- Tipo tag: Google Analytics: GA4 Configuration
- Measurement ID: `G-XXXXXXXXXX`
- Trigger: **All Pages**
- Nome tag: `GA4 - Configuration`

---

### Variabili da creare in GTM

**Variabili Data Layer (Menu: Variabili → Nuova → Variabile livello dati):**

| Nome variabile GTM | Nome nel dataLayer | Tipo |
|---|---|---|
| `DL - Match Slug` | `matchSlug` | Variabile livello dati |
| `DL - Match Title` | `matchTitle` | Variabile livello dati |
| `DL - Tournament` | `tournamentName` | Variabile livello dati |
| `DL - Year` | `matchYear` | Variabile livello dati |
| `DL - Player Name` | `playerName` | Variabile livello dati |
| `DL - Video ID` | `videoId` | Variabile livello dati |
| `DL - Video Action` | `videoAction` | Variabile livello dati |
| `DL - Newsletter Source` | `newsletterSource` | Variabile livello dati |

---

### Trigger da creare in GTM

**Trigger 1 — Newsletter Signup**
- Tipo: Evento personalizzato
- Nome evento: `newsletter_signup`
- Nome trigger: `Trigger - Newsletter Signup`

**Trigger 2 — Video Play**
- Tipo: Evento personalizzato
- Nome evento: `video_play`
- Nome trigger: `Trigger - Video Play`

**Trigger 3 — Clerici Link Click**
- Tipo: Evento personalizzato
- Nome evento: `clerici_link_click`
- Nome trigger: `Trigger - Clerici Link Click`

**Trigger 4 — Match View (scheda partita)**
- Tipo: Visualizzazione di pagina
- Condizione: `Page Path` contiene `/partite/`
- Nome trigger: `Trigger - Match Page View`

**Trigger 5 — Player View**
- Tipo: Visualizzazione di pagina
- Condizione: `Page Path` contiene `/giocatori/`
- Nome trigger: `Trigger - Player Page View`

**Trigger 6 — Search Use**
- Tipo: Evento personalizzato
- Nome evento: `search_performed`
- Nome trigger: `Trigger - Search`

---

### Tag eventi GA4 da creare in GTM

**Tag 1 — Newsletter Signup**
- Tipo: GA4 Event
- Evento: `sign_up`
- Parametri:
  - `method`: `newsletter`
  - `source`: `{{DL - Newsletter Source}}`
- Trigger: `Trigger - Newsletter Signup`
- Nome: `GA4 - Newsletter Signup`

**Tag 2 — Video Play**
- Tipo: GA4 Event
- Evento: `video_start`
- Parametri:
  - `video_id`: `{{DL - Video ID}}`
  - `match_title`: `{{DL - Match Title}}`
  - `tournament`: `{{DL - Tournament}}`
  - `year`: `{{DL - Year}}`
- Trigger: `Trigger - Video Play`
- Nome: `GA4 - Video Play`

**Tag 3 — Clerici Link Click**
- Tipo: GA4 Event
- Evento: `select_content`
- Parametri:
  - `content_type`: `clerici_article`
  - `match_slug`: `{{DL - Match Slug}}`
  - `match_title`: `{{DL - Match Title}}`
- Trigger: `Trigger - Clerici Link Click`
- Nome: `GA4 - Clerici Click`

**Tag 4 — Match Page View arricchito**
- Tipo: GA4 Event
- Evento: `view_item`
- Parametri:
  - `item_id`: `{{DL - Match Slug}}`
  - `item_name`: `{{DL - Match Title}}`
  - `item_category`: `{{DL - Tournament}}`
  - `item_category2`: `{{DL - Year}}`
- Trigger: `Trigger - Match Page View`
- Nome: `GA4 - Match View`

**Tag 5 — Player Page View**
- Tipo: GA4 Event
- Evento: `view_item`
- Parametri:
  - `item_id`: `{{DL - Player Name}}`
  - `item_category`: `player_profile`
- Trigger: `Trigger - Player Page View`
- Nome: `GA4 - Player View`

---

### dataLayer nel codice Next.js

```tsx
// lib/analytics.ts

declare global {
  interface Window { dataLayer: any[] }
}

export function pushEvent(event: string, params: Record<string, any>) {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ event, ...params })
  }
}

// Funzioni specifiche da usare nei componenti

export const trackNewsletterSignup = (source: string) =>
  pushEvent('newsletter_signup', { newsletterSource: source })

export const trackVideoPlay = (videoId: string, matchTitle: string, tournament: string, year: number) =>
  pushEvent('video_play', { videoId, matchTitle, tournamentName: tournament, matchYear: year })

export const trackClericiClick = (matchSlug: string, matchTitle: string) =>
  pushEvent('clerici_link_click', { matchSlug, matchTitle })

export const trackSearch = (query: string, resultsCount: number) =>
  pushEvent('search_performed', { searchQuery: query, resultsCount })
```

```tsx
// Esempio uso in componente
import { trackVideoPlay } from '@/lib/analytics'

function MatchVideo({ videoId, match }) {
  return (
    <iframe
      onLoad={() => trackVideoPlay(videoId, match.title, match.tournament, match.year)}
      src={`https://www.youtube-nocookie.com/embed/${videoId}`}
    />
  )
}
```

---

### Metriche chiave da monitorare in GA4

**Report personalizzati da creare in GA4 → Esplora:**

1. **Funnel newsletter** — da visita homepage a signup
2. **Partite più viste** — dimensione: `item_name`, metrica: `view_item`
3. **Video engagement** — eventi `video_start` per partita
4. **Clerici engagement** — click su link articoli per partita
5. **Retention** — utenti che tornano entro 7 giorni

**Conversioni da marcare in GA4 (Admin → Eventi → Segna come conversione):**
- `sign_up` (newsletter signup)
- `video_start`
- `clerici_link_click`

---

## 10. Licenze e attribuzioni operative

### Cosa puoi fare senza chiedere nulla

| Risorsa | Uso consentito | Attribuzione richiesta |
|---|---|---|
| Dataset Sackmann | Uso non-commerciale, ricerca, prototipo | "Jeff Sackmann / Tennis Abstract (CC-BY-NC-SA)" + link GitHub |
| YouTube embed | Embedding su qualsiasi sito con iframe API | Nessuna — il player YouTube è già attributato |
| Portale Clerici (Cattolica) | Download e uso con citazione | "Fondo Gianni Clerici · Università Cattolica, Brescia" + URL |
| LOC Tennis photos | Uso libero, anche commerciale | Indicare fonte Library of Congress |
| DFW "Federer as Religious Experience" | Solo link — non riprodurre | N/A |

### Cosa richiede accordo prima del lancio commerciale

1. **Jeff Sackmann** — email per licenza commerciale quando il sito genera ricavi
2. **Università Cattolica** — contatto con Pierangelo Goffi (pierangelo.goffi@unicatt.it) per integrazione formale degli articoli Clerici
3. **YouTube quota increase** — richiesta gratuita su Google Cloud Console quando si supera 10k query/giorno

### Footer attribuzioni (da includere in ogni pagina)

```
Dati statistici: Jeff Sackmann / Tennis Abstract (CC-BY-NC-SA 4.0) — github.com/JeffSackmann/tennis_atp
Testi: Archivio Gianni Clerici · Università Cattolica del Sacro Cuore, Brescia · brescia-raccoltestoriche-gianniclerici.unicatt.it
Video: canali YouTube ufficiali US Open (USTA), Australian Open, Roland Garros
```

---

## 11. Priorità di sviluppo — ordine consigliato

### Sprint 1 (settimane 1–2) — Fondamenta
- [ ] Setup Next.js + Vercel + Supabase
- [ ] Import CSV Sackmann anni 1993–1997 (le stagioni più iconiche per prime)
- [ ] Schema database e API routes base
- [ ] Design system: variabili CSS, font, componenti base

### Sprint 2 (settimane 3–4) — Pagine core
- [ ] Homepage con le 10 partite in evidenza
- [ ] Scheda partita con stats + video placeholder + link Clerici
- [ ] Profilo giocatore con career stats visualizzate
- [ ] Navigazione e routing completo

### Sprint 3 (settimane 5–6) — Contenuto e distribuzione
- [ ] Form newsletter Beehiiv integrato
- [ ] Cron job matching YouTube
- [ ] GTM + GA4 configurati e testati
- [ ] Prima edizione newsletter
- [ ] Account social creati con prime 5 partite pubblicate

### Sprint 4 (settimane 7–8) — SEO e ottimizzazione
- [ ] Meta tag dinamici per ogni scheda partita
- [ ] Sitemap XML automatica
- [ ] OG image generation con Vercel OG
- [ ] Performance audit (Core Web Vitals)
- [ ] Import esteso a tutti gli anni 1985–2000

---

## 12. Note finali per Claude Code

- Il progetto è in **fase 1 non-commerciale** — nessun paywall, nessun abbonamento, tutto aperto
- Usare la palette colori esatta — in particolare evitare il nero come colore dominante delle sezioni (solo navbar e accenti puntuali)
- L'hero della homepage deve usare foto dalla Library of Congress come texture di sfondo a bassa opacità, non come immagine hero in primo piano
- Tutti i numeri statistici devono usare `font-variant-numeric: tabular-nums` per allineamento corretto
- Il componente `ClericiVoice` deve sempre mostrare l'attribuzione completa sotto l'estratto
- Il video embed deve usare `youtube-nocookie.com` per privacy enhanced mode
- Ogni scheda partita deve avere un fallback elegante per video non disponibili (Wimbledon anni '90 non ha copertura YouTube)
- Il footer deve sempre includere le tre righe di attribuzione delle fonti dati

---

*Documento generato per il progetto Ace Chronicle · Fase 1 non-commerciale · Licenze: vedere sezione 10*
