# Prompt per Claude Code — Ace Chronicle

Devi costruire un sito web chiamato **Ace Chronicle**, un archivio editoriale del tennis degli anni '90 (1985–2000). Leggi attentamente tutto prima di scrivere una riga di codice.

---

## Cos'è il progetto

Un sito che unisce tre elementi su ogni partita storica del tennis:
- **Statistiche** dal dataset open di Jeff Sackmann (CSV su GitHub)
- **Video** embedati dai canali YouTube ufficiali degli Slam (USTA, Australian Open, Roland Garros)
- **Voce narrante** — brevi estratti (massimo una frase) dagli articoli di Gianni Clerici su Repubblica, con attribuzione completa e link all'originale

Il progetto è in **fase 1 non-commerciale**. Nessun paywall, nessun abbonamento, tutto aperto.

---

## Stack tecnologico

- **Framework**: Next.js 14 con App Router
- **Deploy**: Vercel (tier free)
- **Database**: Supabase (tier free, PostgreSQL)
- **Styling**: Tailwind CSS
- **Font**: Google Fonts — DM Serif Display, DM Sans, Bebas Neue
- **Newsletter**: Beehiiv (form embed, API)
- **Analytics**: Google Tag Manager + GA4

---

## Design system — rispettalo esattamente

### Palette
```css
--paper:   #F5F2EB;  /* background principale */
--ink:     #1A1A1A;  /* testo primario */
--accent:  #534AB7;  /* viola — unico colore brand */
--gold:    #C8A85C;  /* solo per record e titoli speciali */
--coral:   #D84F2E;  /* accento caldo, uso sparso */
--muted:   #7A7870;  /* testo secondario */
--border:  rgba(26,26,26,0.10);
--surface: #FFFFFF;
```

**Regole colore critiche:**
- Il viola `#534AB7` è l'unico accent — mai rosso, verde, arancio per link o CTA
- Background sempre `#F5F2EB`, mai bianco puro
- **Il nero NON è il colore dominante delle sezioni** — usarlo solo per navbar e accenti puntuali

### Tipografia
- Titoli narrativi: **DM Serif Display** (anche italic per enfasi)
- UI, body, label: **DM Sans**
- Numeri grandi (punteggi, stats, ranking): **Bebas Neue**
- Tutti i numeri: `font-variant-numeric: tabular-nums`

### Elementi grafici di brand
1. **Griglia decorativa** — `background-image: linear-gradient(...)` a 32px, opacity 3–4% — nelle sezioni hero su sfondo scuro
2. **Anno in sovrimpressione** — Bebas Neue 80–100px, opacity 4–5%, colore bianco — elemento decorativo nelle hero
3. **Divisore brand** — linea 3px colore ink con segmento viola 40px al centro — separa sezioni principali
4. **Numerazione partite** — Bebas Neue 28px, opacity 12%, diventa viola al hover
5. **Section label** — 10px / uppercase / letter-spacing .12em con `::after` linea decorativa

### Navbar
```
Background: #1A1A1A
Logo: Bebas Neue — "ACE · CHRONICLE" con il punto in #534AB7
Link: DM Sans 11px, rgba(255,255,255,.55)
CTA "Newsletter →": background #534AB7, testo bianco, border-radius 2px
Border bottom: 2px solid #534AB7
```

### Score card (scheda partita)
```
Sfondo vincitore: rgba(83,74,183,.12)
Nome vincitore: Bebas Neue, color #534AB7
Set vinti: Bebas Neue 22px, color #1A1A1A
Set persi: Bebas Neue 22px, color rgba(26,26,26,.25)
```

### Hero section — fotografie
Usa immagini dalla **Library of Congress** (loc.gov/free-to-use/tennis) come texture di sfondo a bassa opacità (10–15%) con overlay. Non usarle come immagini hero in primo piano. Abbina sempre tipografia dominante sopra.

---

## Struttura pagine e routing

```
/                          → Homepage
/partite                   → Lista partite con filtri
/partite/[slug]            → Scheda partita singola
/giocatori                 → Lista giocatori
/giocatori/[slug]          → Profilo giocatore con career stats
/tornei                    → Lista tornei
/tornei/[slug]/[anno]      → Tabellone completo
/la-voce-narrante          → Sezione Clerici
/newsletter                → Pagina newsletter
```

**Slug convention:**
- Partite: `sampras-agassi-us-open-1995-finale`
- Giocatori: `pete-sampras`
- Tornei: `us-open`

---

## Schema database Supabase

Crea queste tabelle:

```sql
CREATE TABLE players (
  id            SERIAL PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  country_code  CHAR(3),
  hand          CHAR(1),
  birth_date    DATE,
  height_cm     INTEGER,
  atp_peak_rank INTEGER,
  grand_slams   INTEGER DEFAULT 0,
  active_from   INTEGER,
  active_to     INTEGER,
  bio_it        TEXT,
  bio_en        TEXT
);

CREATE TABLE tournaments (
  id            SERIAL PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  surface       TEXT,
  category      TEXT,
  country_code  CHAR(3),
  city          TEXT
);

CREATE TABLE matches (
  id                      SERIAL PRIMARY KEY,
  slug                    TEXT UNIQUE NOT NULL,
  tournament_id           INTEGER REFERENCES tournaments(id),
  year                    SMALLINT NOT NULL,
  match_date              DATE,
  round                   TEXT,
  surface                 TEXT,
  winner_id               INTEGER REFERENCES players(id),
  loser_id                INTEGER REFERENCES players(id),
  winner_rank             SMALLINT,
  loser_rank              SMALLINT,
  score                   TEXT,
  duration_min            SMALLINT,
  w_ace                   SMALLINT,
  w_df                    SMALLINT,
  w_1stIn                 SMALLINT,
  w_1stWon                SMALLINT,
  w_2ndWon                SMALLINT,
  w_svpt                  SMALLINT,
  w_bpSaved               SMALLINT,
  w_bpFaced               SMALLINT,
  l_ace                   SMALLINT,
  l_df                    SMALLINT,
  l_1stIn                 SMALLINT,
  l_1stWon                SMALLINT,
  l_2ndWon                SMALLINT,
  l_svpt                  SMALLINT,
  l_bpSaved               SMALLINT,
  l_bpFaced               SMALLINT,
  youtube_video_id        TEXT,
  youtube_channel         TEXT,
  youtube_verified_at     TIMESTAMPTZ,
  clerici_excerpt_it      TEXT,       -- max 300 chars, UNA sola frase
  clerici_source          TEXT,       -- es. "La Repubblica, 11 settembre 1995"
  clerici_article_url     TEXT,       -- link all'articolo su ricerca.repubblica.it
  editorial_note_it       TEXT,
  featured                BOOLEAN DEFAULT false,
  featured_week           DATE
);

CREATE TABLE rankings (
  id          SERIAL PRIMARY KEY,
  player_id   INTEGER REFERENCES players(id),
  rank_date   DATE NOT NULL,
  rank        SMALLINT NOT NULL,
  rank_points INTEGER
);
```

---

## Import dati Sackmann

Scrivi uno script Python `scripts/import_sackmann.py` che:
1. Scarica i CSV da `https://raw.githubusercontent.com/JeffSackmann/tennis_atp/master/atp_matches_{year}.csv` per gli anni 1993–1997 (le stagioni più iconiche — prima priorità)
2. Li importa nella tabella `matches` di Supabase
3. Genera automaticamente gli slug `{player1}-{player2}-{tournament}-{year}-{round}`

Attribuzione obbligatoria nel footer del sito:
```
Dati: Jeff Sackmann / Tennis Abstract (CC-BY-NC-SA 4.0) — github.com/JeffSackmann/tennis_atp
```

---

## Matching YouTube

Crea `app/api/cron/youtube-match/route.ts` — cron job settimanale che:
1. Prende le partite senza `youtube_video_id`
2. Cerca su YouTube Data API v3 per keyword su questi channelId ufficiali:
   - US Open (USTA): `UCkBSdkMpwSdJNRQb5aRkJwA`
   - Australian Open: `UCMKoSCkD0gMi1HYbZ5ZtLnQ`
   - Roland Garros: canale ufficiale FFT
3. Salva il `videoId` trovato in Supabase
4. Verifica settimanalmente che i video esistano ancora — se rimossi, svuota il campo

**Embed video**: usa sempre `youtube-nocookie.com/embed/{videoId}` per privacy enhanced mode. Se `youtube_video_id` è null, mostra un placeholder elegante "Video non disponibile per questa partita".

---

## Componente ClericiVoice

Regole critiche:
- Mostra **massimo una frase** di estratto (campo `clerici_excerpt_it`)
- Attribuzione obbligatoria: nome autore + testata + data
- Link "Leggi l'articolo completo →" che apre `clerici_article_url` in nuova tab
- Se `clerici_excerpt_it` è null, il componente non appare

```tsx
// components/ClericiVoice.tsx
export function ClericiVoice({ excerpt, articleUrl, source }) {
  if (!excerpt) return null
  return (
    <div className="clerici-section">
      <div className="clerici-header">
        <div className="clerici-monogram">GC</div>
        <div>
          <p className="clerici-name">Gianni Clerici</p>
          <p className="clerici-pub">{source}</p>
        </div>
      </div>
      <blockquote className="clerici-quote">"{excerpt}"</blockquote>
      <a href={articleUrl} target="_blank" rel="noopener noreferrer">
        Leggi l'articolo completo su La Repubblica →
      </a>
      <p className="clerici-attribution">
        © La Repubblica / GEDI — riproduzione parziale per fini culturali ex art. 70 L. 633/1941
      </p>
    </div>
  )
}
```

---

## Google Tag Manager

Installa GTM con ID `GTM-XXXXXXX` (da sostituire) in `app/layout.tsx` usando `next/script` con `strategy="afterInteractive"`.

Crea `lib/analytics.ts` con queste funzioni:

```typescript
export const trackNewsletterSignup = (source: string) =>
  pushEvent('newsletter_signup', { newsletterSource: source })

export const trackVideoPlay = (videoId: string, matchTitle: string, tournament: string, year: number) =>
  pushEvent('video_play', { videoId, matchTitle, tournamentName: tournament, matchYear: year })

export const trackClericiClick = (matchSlug: string, matchTitle: string) =>
  pushEvent('clerici_link_click', { matchSlug, matchTitle })

export const trackSearch = (query: string, resultsCount: number) =>
  pushEvent('search_performed', { searchQuery: query, resultsCount })
```

---

## SEO — meta tag dinamici

Ogni scheda partita deve avere:
```
title: "{Vincitore} b. {Perdente} {score} | {Torneo} {Anno} {Round} | Ace Chronicle"
description: "Statistiche complete, video e la cronaca di Gianni Clerici di {Torneo} {Anno} tra {Vincitore} e {Perdente}."
```

Genera OG image dinamica con Vercel OG: sfondo `#F5F2EB`, nomi giocatori in Bebas Neue, punteggio, logo Ace Chronicle.

---

## Newsletter Beehiiv

Embeda il form di iscrizione Beehiiv nella homepage (colonna destra) e nella pagina `/newsletter`. Usa l'API Beehiiv per mostrare le ultime 3 edizioni nella pagina newsletter.

---

## Footer — attribuzioni obbligatorie

Ogni pagina deve avere nel footer:
```
Dati statistici: Jeff Sackmann / Tennis Abstract (CC-BY-NC-SA 4.0) — github.com/JeffSackmann/tennis_atp
Testi: © La Repubblica / GEDI — citazioni per fini culturali ex art. 70 L. 633/1941
Video: canali YouTube ufficiali US Open (USTA), Australian Open, Roland Garros
Fase 1 · Non commerciale
```

---

## Ordine di sviluppo consigliato

1. Setup Next.js + Vercel + Supabase + schema DB
2. Script import Sackmann anni 1993–1997
3. Design system: variabili CSS, font, componenti base
4. Homepage con 10 partite in evidenza hardcodate
5. Scheda partita completa
6. Profilo giocatore con career stats
7. Cron job YouTube matching
8. GTM + GA4
9. Form newsletter Beehiiv
10. SEO: meta tag dinamici + sitemap + OG image
11. Import esteso tutti gli anni 1985–2000

---

## Note finali

- Testa ogni componente con dati reali di Sackmann, non con dati fittizi
- Il divisore brand (linea con segmento viola) deve apparire tra ogni sezione principale della homepage
- Tutti i numeri statistici: `font-variant-numeric: tabular-nums`
- Video embed: sempre `youtube-nocookie.com`, mai `youtube.com`
- Wimbledon non ha video d'archivio su YouTube — gestisci il fallback con eleganza
- Non usare `localStorage` o `sessionStorage`
- Commit frequenti su GitHub — Vercel fa deploy automatico ad ogni push su `main`
