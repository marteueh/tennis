# Prompt per Claude Code — Ace Chronicle
*Versione 2 — completo di area admin, impatto culturale, seed data, foto giocatori*

Devi costruire un sito web chiamato **Ace Chronicle**, un archivio editoriale del tennis degli anni '90 (1985–2000). Leggi attentamente tutto prima di scrivere una riga di codice.

---

## Cos'è il progetto

Un sito che unisce quattro elementi su ogni partita storica del tennis:
- **Statistiche** dal dataset open di Jeff Sackmann (CSV su GitHub)
- **Video** embedati dai canali YouTube ufficiali degli Slam
- **Voci letterarie** — estratti brevi da Clerici (Repubblica), DFW (Esquire), altri autori verificati
- **Impatto culturale** — film, libri, spot, documentari, momenti storici collegati a quella partita

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

### Score card
```
Sfondo vincitore: rgba(83,74,183,.12)
Nome vincitore: Bebas Neue, color #534AB7
Set vinti: Bebas Neue 22px, color #1A1A1A
Set persi: Bebas Neue 22px, color rgba(26,26,26,.25)
```

### Hero section — fotografie
Usa immagini dalla **Library of Congress** (loc.gov/free-to-use/tennis) come texture di sfondo a bassa opacità (10–15%) con overlay. Non usarle come immagini hero in primo piano.

---

## Struttura pagine e routing

```
/                          → Homepage
/partite                   → Lista partite con filtri
/partite/[slug]            → Scheda partita singola
/giocatori                 → Lista giocatori
/giocatori/[slug]          → Profilo giocatore con career stats e foto
/tornei                    → Lista tornei
/tornei/[slug]/[anno]      → Tabellone completo
/la-voce-narrante          → Sezione voci letterarie aggregate
/newsletter                → Pagina newsletter
/admin                     → Area admin (protetta da password env)
/admin/partite             → Lista partite admin
/admin/partite/[slug]      → Scheda partita admin — editing completo
/admin/giocatori           → Lista giocatori admin
/admin/giocatori/[slug]    → Profilo giocatore admin — foto + bio
```

---

## Schema database Supabase — COMPLETO

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
  bio_en        TEXT,
  photo_url     TEXT,        -- URL foto profilo (Wikimedia Commons o altro free)
  photo_credit  TEXT         -- attribuzione fotografica obbligatoria
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
  w_ace SMALLINT, w_df SMALLINT, w_svpt SMALLINT,
  w_1stIn SMALLINT, w_1stWon SMALLINT, w_2ndWon SMALLINT,
  w_bpSaved SMALLINT, w_bpFaced SMALLINT,
  l_ace SMALLINT, l_df SMALLINT, l_svpt SMALLINT,
  l_1stIn SMALLINT, l_1stWon SMALLINT, l_2ndWon SMALLINT,
  l_bpSaved SMALLINT, l_bpFaced SMALLINT,
  youtube_video_id        TEXT,
  youtube_channel         TEXT,
  youtube_verified_at     TIMESTAMPTZ,
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

-- Voci letterarie collegate alle partite
CREATE TABLE literary_voices (
  id            SERIAL PRIMARY KEY,
  match_id      INTEGER REFERENCES matches(id),
  player_id     INTEGER REFERENCES players(id),
  author        TEXT NOT NULL,
  publication   TEXT NOT NULL,
  pub_date      DATE,
  excerpt       TEXT NOT NULL,  -- max 300 caratteri, UNA sola frase
  article_url   TEXT,
  language      CHAR(2) DEFAULT 'it',
  attribution   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Impatto culturale collegato a partite, giocatori o tornei
CREATE TABLE cultural_impact (
  id            SERIAL PRIMARY KEY,
  match_id      INTEGER REFERENCES matches(id),
  player_id     INTEGER REFERENCES players(id),
  tournament_id INTEGER REFERENCES tournaments(id),
  content_type  TEXT NOT NULL,
  -- film / book / music / article / ad / documentary / artwork / photo / other
  title         TEXT NOT NULL,
  year          SMALLINT,
  author        TEXT,
  editorial_note TEXT NOT NULL,
  external_url  TEXT,
  link_level    TEXT DEFAULT 'direct',
  -- direct = cita esplicitamente quella partita
  -- contextual = stesso periodo, aiuta a capire il contesto
  -- archetypal = narrativa più ampia di cui la partita fa parte
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_literary_match ON literary_voices(match_id);
CREATE INDEX idx_cultural_match ON cultural_impact(match_id);
CREATE INDEX idx_cultural_player ON cultural_impact(player_id);
CREATE INDEX idx_matches_year ON matches(year);
CREATE INDEX idx_matches_featured ON matches(featured) WHERE featured = true;
```

---

## Script seed editoriale — `scripts/seed_editorial.py`

Esegui questo script DOPO `import_sackmann.py`. Popola `literary_voices` e `cultural_impact` con contenuto già ricercato e verificato. L'admin non deve fare ricerche — trova i contenuti già presenti e li modifica se necessario.

```python
import os
from supabase import create_client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_match_id(slug):
    r = supabase.table("matches").select("id").eq("slug", slug).single().execute()
    return r.data["id"] if r.data else None

def get_player_id(slug):
    r = supabase.table("players").select("id").eq("slug", slug).single().execute()
    return r.data["id"] if r.data else None

# ─── VOCI LETTERARIE ────────────────────────────────────────────────────────

LITERARY_VOICES = [
  {
    "match_slug": "sampras-agassi-us-open-1995-finale",
    "author": "David Foster Wallace",
    "publication": "Esquire",
    "pub_date": "1996-07-01",
    "excerpt": "Tennis is the most beautiful sport there is, and also the most demanding.",
    "article_url": "https://www.esquire.com/sports/a5151/the-string-theory-0796/",
    "language": "en",
    "attribution": "© Esquire / Hearst — citazione per fini culturali ex art. 70 L. 633/1941"
  },
  # NOTA: gli estratti Clerici vanno aggiunti manualmente dall'admin
  # cercando su ricerca.repubblica.it partita per partita.
  # Struttura da usare nell'admin:
  # author="Gianni Clerici", publication="La Repubblica",
  # excerpt=una sola frase max 300 caratteri,
  # attribution="© La Repubblica / GEDI — art. 70 L. 633/1941"
]

# ─── IMPATTO CULTURALE ──────────────────────────────────────────────────────

CULTURAL_IMPACT = [

  # RIVALITÀ SAMPRAS–AGASSI

  {
    "match_slug": "sampras-agassi-us-open-1995-finale",
    "content_type": "ad",
    "title": "Nike 'Guerrilla Tennis' — Sampras vs Agassi per le strade di San Francisco",
    "year": 1995,
    "author": "Spike Jonze / Wieden+Kennedy",
    "editorial_note": "Lo spot simbolo della rivalità: i due escono da un taxi a San Francisco, montano una rete in mezzo al traffico e si sfidano finché un autobus distrugge la rete. Diretto da Spike Jonze reduce da 'Sabotage' dei Beastie Boys. Trasmesso durante l'US Open 1995 — lo stesso torneo di questa finale. Vinse un Silver Lion a Cannes. Nel 2015 fu ricreato a New York con Federer, Nadal, Serena e McEnroe.",
    "external_url": "https://www.youtube.com/results?search_query=nike+guerrilla+tennis+1995",
    "link_level": "direct"
  },
  {
    "match_slug": "sampras-agassi-us-open-1995-finale",
    "content_type": "book",
    "title": "Open — Un'autobiografia",
    "year": 2009,
    "author": "Andre Agassi con J.R. Moehringer",
    "editorial_note": "Agassi racconta in dettaglio come la sconfitta in questa finale lo distrusse per due anni. Scrive: 'Sono 26-1, e darei tutte queste vittorie per questa sola. C'è sempre Pete.' Bestseller mondiale, considerato uno dei migliori libri sportivi mai scritti. Prima pagina: 'Odio il tennis, lo odio con tutto il cuore, eppure continuo a giocare.'",
    "external_url": "https://www.goodreads.com/book/show/6480781-open",
    "link_level": "direct"
  },
  {
    "match_slug": "sampras-agassi-us-open-1995-finale",
    "content_type": "book",
    "title": "A Champion's Mind",
    "year": 2008,
    "author": "Pete Sampras con Peter Bodo",
    "editorial_note": "Sampras scrive che la vittoria del 1995 'aprì i cancelli' per i successivi sei Slam, e che ebbe 'un effetto devastante su Andre, che ammise di aver impiegato due anni per riprendersi da quella sconfitta.' Tono riservato e clinico, risposta implicita all'Open di Agassi.",
    "external_url": "https://www.goodreads.com/book/show/3044956-a-champion-s-mind",
    "link_level": "direct"
  },
  {
    "match_slug": "sampras-agassi-us-open-1995-finale",
    "content_type": "article",
    "title": "Tennis Player Michael Joyce's Professional Artistry… (The String Theory)",
    "year": 1996,
    "author": "David Foster Wallace",
    "editorial_note": "Wallace era in tribuna durante l'US Open 1995 — lo stesso torneo di questa finale. L'essay segue Michael Joyce nelle qualificazioni e usa Sampras e Agassi come sfondo onnipresente e quasi mitologico. Testo integrale disponibile gratuitamente su Esquire.com.",
    "external_url": "https://www.esquire.com/sports/a5151/the-string-theory-0796/",
    "link_level": "contextual"
  },
  {
    "match_slug": "sampras-agassi-us-open-1995-finale",
    "content_type": "film",
    "title": "Borg McEnroe",
    "year": 2017,
    "author": "Janus Metz (regista)",
    "editorial_note": "Il film racconta la finale Wimbledon 1980 (Borg vs McEnroe, tie-break 18-16 al quarto set). La narrativa ghiaccio vs. fuoco — Borg metodico, McEnroe esplosivo — è l'archetipo esatto che i media usarono per Sampras (ghiaccio) vs. Agassi (fuoco) negli anni '90. La rivalità Sampras-Agassi fu universalmente descritta come l'erede di Borg-McEnroe.",
    "external_url": "https://www.imdb.com/title/tt4399460/",
    "link_level": "archetypal"
  },

  # CHANG vs LENDL — Roland Garros 1989

  {
    "match_slug": "chang-lendl-roland-garros-1989-r4",
    "content_type": "documentary",
    "title": "Iconic Moments: Chang vs Lendl — Roland Garros 4th Round, 1989",
    "year": 2022,
    "author": "Roland Garros Official / FFT",
    "editorial_note": "Mini-documentario ufficiale con footage originale e interviste. Chang racconta: 'Ero sotto 15-30, dovevo fare qualcosa di diverso. Ho servito da sotto tanto per vedere l'effetto che faceva.' La banana ai cambi campo fu il primo utilizzo documentato di questo rituale nel tennis professionistico. La vigilia, Chang guardava le notizie di Piazza Tienanmen.",
    "external_url": "https://www.youtube.com/watch?v=u0NkCiZsAJ4",
    "link_level": "direct"
  },
  {
    "match_slug": "chang-lendl-roland-garros-1989-r4",
    "content_type": "other",
    "title": "Il servizio da sotto — simbolo culturale del problem solving sotto pressione",
    "year": 1989,
    "author": "Michael Chang",
    "editorial_note": "Il servizio da sotto di Chang è entrato nei manuali di psicologia sportiva come esempio di creatività tattica sotto stress estremo. La metafora 'Davide contro Golia con una banana al posto della fionda' è usata universalmente nel giornalismo sportivo ancora oggi. Chang aveva 17 anni ed è ancora il più giovane vincitore Slam maschile della storia.",
    "external_url": "https://www.rolandgarros.com/en-us/article/rg-archives-epic-match-chang-lendl-1989-fourth-round",
    "link_level": "direct"
  },

  # IVANISEVIC vs RAFTER — Wimbledon 2001

  {
    "match_slug": "ivanisevic-rafter-wimbledon-2001-finale",
    "content_type": "film",
    "title": "Wimbledon",
    "year": 2004,
    "author": "Richard Loncraine (regista)",
    "editorial_note": "Commedia romantica con Paul Bettany e Kirsten Dunst esplicitamente ispirata alla vittoria di Ivanisevic nel 2001: un tennista in declino ottiene una wild card e vince contro ogni pronostico. È la prova più concreta dell'impatto culturale di quella partita — penetrata nell'immaginario collettivo al punto da diventare soggetto di una rom-com hollywoodiana.",
    "external_url": "https://www.imdb.com/title/tt0360201/",
    "link_level": "direct"
  },
  {
    "match_slug": "ivanisevic-rafter-wimbledon-2001-finale",
    "content_type": "documentary",
    "title": "Wimbledon Official Film 2001",
    "year": 2001,
    "author": "AELTC / Wimbledon",
    "editorial_note": "Film ufficiale del torneo — rating 9.3/10 su IMDB. Cattura il 'People's Monday': la finale spostata al lunedì per la pioggia. Ivanisevic che si arrampica nel box della famiglia dopo il match point è una delle immagini più iconiche del tennis moderno. Il padre Srdjan aveva subito un bypass triplo poche settimane prima. Prima finale di Wimbledon disputata di lunedì dalla Seconda Guerra Mondiale.",
    "external_url": "https://www.imdb.com/title/tt1845324/",
    "link_level": "direct"
  },

  # AGASSI — scheda giocatore

  {
    "player_slug": "andre-agassi",
    "content_type": "ad",
    "title": "Canon 'Image is Everything' — Andre Agassi",
    "year": 1992,
    "author": "Canon",
    "editorial_note": "Lo spot che rese Agassi un'icona pop globale prima ancora che vincesse Wimbledon. Il claim 'Image is Everything' fu rivolto contro di lui per anni. Quando vinse Wimbledon 1992 con parrucchino e jeans shorts dimostrò che immagine e sostanza potevano coesistere. Nell'autobiografia 'Open' ammette: 'quella pubblicità mi ha perseguitato per anni.'",
    "external_url": "https://www.youtube.com/results?search_query=canon+image+is+everything+agassi+1992",
    "link_level": "contextual"
  },

  # BECKER — scheda giocatore

  {
    "player_slug": "boris-becker",
    "content_type": "documentary",
    "title": "Boris Becker: The Champ (Netflix)",
    "year": 2023,
    "author": "Netflix / Lorton Entertainment",
    "editorial_note": "Docuserie in 2 episodi prodotta mentre Becker era in carcere per bancarotta fraudolenta. Interviste con Djokovic, McEnroe, Stich. Ripercorre la finale Wimbledon 1985 (Becker 17 anni, primo non-testa di serie a vincere Wimbledon) come punto di partenza dell'era teenager nel tennis. Disponibile su Netflix.",
    "external_url": "https://www.netflix.com/title/81316663",
    "link_level": "direct"
  },

  # SELES — scheda giocatore

  {
    "player_slug": "monica-seles",
    "content_type": "other",
    "title": "L'accoltellamento di Monica Seles — Amburgo, 30 aprile 1993",
    "year": 1993,
    "author": "evento storico",
    "editorial_note": "Durante un cambio di campo a un torneo di Amburgo, Seles venne accoltellata alla schiena da un fan di Steffi Graf. Non tornò alle competizioni per due anni. L'episodio portò a riforme sulla sicurezza nel tennis. La Graf ammise che quel periodo senza Seles tolse valore alle sue vittorie. Il ritorno di Seles nel 1995 al Canadian Open fu accolto da un'ovazione di diversi minuti.",
    "external_url": "https://en.wikipedia.org/wiki/Stabbing_of_Monica_Seles",
    "link_level": "contextual"
  },

  # SAMPRAS — Australian Open 1995 SF (pianto per Gullikson)

  {
    "match_slug": "sampras-courier-australian-open-1995-sf",
    "content_type": "other",
    "title": "Il pianto di Sampras per Tim Gullikson",
    "year": 1995,
    "author": "Pete Sampras",
    "editorial_note": "Durante questa semifinale Sampras scoppiò in lacrime dopo aver saputo che il suo allenatore Tim Gullikson aveva un tumore al cervello terminale. Vinse la semifinale e poi la finale su Agassi. Gullikson morì nel 1996. Questo momento trasformò l'immagine pubblica di Sampras da robot freddo a essere umano vulnerabile. Agassi racconta nell'autobiografia che quella vittoria con le lacrime agli occhi fu quasi impossibile da guardare.",
    "external_url": "https://en.wikipedia.org/wiki/1995_Australian_Open_%E2%80%93_Men%27s_singles",
    "link_level": "direct"
  },

  # SAMPRAS — Wimbledon 1999 F vs Agassi ("He walked on water")

  {
    "match_slug": "sampras-agassi-wimbledon-1999-finale",
    "content_type": "other",
    "title": '"He walked on water" — la citazione di Agassi su Sampras',
    "year": 1999,
    "author": "Andre Agassi",
    "editorial_note": "Dopo la sconfitta in questa finale, Agassi disse ai giornalisti: 'He walked on water.' Sampras ha sempre considerato questa la partita più bella della sua carriera: 17 ace, 75 winner, 13 errori non forzati in 1h 55m. Giocata il 4 luglio 1999 — Independence Day americano. Fu il record 12° Slam di Sampras, pareggiando Roy Emerson. Il record venne poi superato da Federer nel 2009 — che in conferenza stampa citò proprio la rivalità Becker-Edberg come ispirazione a scegliere il tennis.",
    "external_url": "https://www.atptour.com/en/news/sampras-1999-wimbledon-atp-heritage-feature",
    "link_level": "direct"
  },
  {
    "match_slug": "sampras-agassi-wimbledon-1999-finale",
    "content_type": "documentary",
    "title": "Legends of Wimbledon: Pete Sampras",
    "year": 2006,
    "author": "Wimbledon / AELTC",
    "editorial_note": "Documentario ufficiale sul percorso di Sampras a Wimbledon — dalla prima partecipazione nel 1989 alla vittoria record del 2000. Rating 8.8/10 su IMDB. Copre in dettaglio la finale 1999 contro Agassi come apice della carriera sull'erba. Include interviste e footage inedito.",
    "external_url": "https://www.imdb.com/title/tt1348313/",
    "link_level": "contextual"
  },

  # BECKER vs EDBERG — trilogia Wimbledon 1988-1989-1990

  {
    "match_slug": "edberg-becker-wimbledon-1990-finale",
    "content_type": "other",
    "title": "La trilogia Becker-Edberg — archetipo di tutte le rivalità degli anni '90",
    "year": 1990,
    "author": "Boris Becker / Stefan Edberg",
    "editorial_note": "Becker ed Edberg giocarono tre finali consecutive di Wimbledon (1988-1989-1990) — un record nell'era Open. Edberg disse: 'Ero riservato e introverso, Boris era l'esatto contrario: irascibile ed emotivo.' Nel 2009, Federer dopo aver vinto il suo 15° Slam disse in conferenza stampa che la rivalità Becker-Edberg era stata la sua ispirazione a scegliere il tennis. La rivalità continuò poi come allenatori: Becker coaching Djokovic, Edberg coaching Federer, 2014-2015.",
    "external_url": "https://en.wikipedia.org/wiki/Becker%E2%80%93Edberg_rivalry",
    "link_level": "direct"
  },

  # EDBERG — US Open 1991 F vs Courier (la prestazione della vita)

  {
    "match_slug": "edberg-courier-us-open-1991-finale",
    "content_type": "other",
    "title": "La finale perfetta di Edberg — 6-2 6-4 6-0 in 75 minuti",
    "year": 1991,
    "author": "Stefan Edberg",
    "editorial_note": "Edberg demolì Courier 6-2, 6-4, 6-0 in 75 minuti — la prestazione che lui stesso definì la migliore della sua carriera. Courier era il futuro N°1 del mondo. Il match è citato da Becker come esempio di 'tennis perfetto su hard court'. Edberg e Courier si sarebbero poi sfidati nelle finali Australian Open 1992 e 1993 — una rivalità costruita esattamente su questo squilibrio.",
    "external_url": "https://en.wikipedia.org/wiki/1991_US_Open_%E2%80%93_Men%27s_singles",
    "link_level": "direct"
  },

  # AGASSI — Wimbledon 1992 F vs Ivanisevic (il parrucchino vince Wimbledon)

  {
    "match_slug": "agassi-ivanisevic-wimbledon-1992-finale",
    "content_type": "other",
    "title": "Il parrucchino che vinse Wimbledon — Agassi 1992",
    "year": 1992,
    "author": "Andre Agassi",
    "editorial_note": "Agassi vinse Wimbledon 1992 con jeans shorts, capelli lunghi (in realtà un parrucchino, come rivelò nell'autobiografia) e la reputazione di 'image is everything'. Fu il primo Slam di Agassi, vinto nel tempio più tradizionale del tennis. La stampa lo descrisse come 'la rivoluzione pop del tennis'. Nell'autobiografia scrisse che teneva il parrucchino con uno spillo durante tutta la finale, terrorizzato che potesse volare via.",
    "external_url": "https://en.wikipedia.org/wiki/1992_Wimbledon_Championships_%E2%80%93_Men%27s_singles",
    "link_level": "direct"
  },

  # AGASSI — Roland Garros 1999 F vs Medvedev (Career Grand Slam)

  {
    "match_slug": "agassi-medvedev-roland-garros-1999-finale",
    "content_type": "book",
    "title": "Open — capitolo Roland Garros 1999",
    "year": 2009,
    "author": "Andre Agassi con J.R. Moehringer",
    "editorial_note": "Agassi racconta nell'autobiografia che questa vittoria — dopo essere stato sotto 0-2 set contro Medvedev — fu il momento più importante della sua carriera. Completò il Career Grand Slam da N°141 del mondo risalito a N°1. Scrisse: 'Non mi importa di nient'altro. Ho vinto Roland Garros. Sono uno dei pochi uomini ad aver vinto tutti e quattro gli Slam.' Due settimane dopo perse la finale di Wimbledon contro Sampras — 'He walked on water.'",
    "external_url": "https://www.goodreads.com/book/show/6480781-open",
    "link_level": "direct"
  },

  # RIVALITÀ BECKER-EDBERG — come allenatori di Djokovic e Federer

  {
    "player_slug": "stefan-edberg",
    "content_type": "other",
    "title": "Becker e Edberg allenatori — la rivalità continua nel 2014-2015",
    "year": 2014,
    "author": "Novak Djokovic / Roger Federer",
    "editorial_note": "La rivalità Becker-Edberg degli anni '80-'90 ebbe un capitolo finale inatteso: Becker divenne coach di Djokovic e Edberg di Federer nel 2014. I due ex rivali si ritrovarono sulle stesse sedie tecniche, nelle stesse partite. Becker commentò: 'Non avrei mai immaginato che la nostra rivalità potesse continuare così.' Fu ampiamente descritto dai media come 'la più bella storia del tennis moderno'.",
    "external_url": "https://en.wikipedia.org/wiki/Becker%E2%80%93Edberg_rivalry",
    "link_level": "archetypal"
  },

]

# ─── ESECUZIONE ──────────────────────────────────────────────────────────────

def seed_literary_voices():
    seeded = 0
    for v in LITERARY_VOICES:
        match_id = get_match_id(v["match_slug"])
        if not match_id:
            print(f"  SKIP literary: match not found — {v['match_slug']}")
            continue
        supabase.table("literary_voices").upsert({
            "match_id": match_id,
            "author": v["author"],
            "publication": v["publication"],
            "pub_date": v.get("pub_date"),
            "excerpt": v["excerpt"],
            "article_url": v.get("article_url"),
            "language": v.get("language", "it"),
            "attribution": v.get("attribution", "")
        }).execute()
        seeded += 1
    print(f"Seeded {seeded}/{len(LITERARY_VOICES)} literary voices")

def seed_cultural_impact():
    seeded = 0
    for c in CULTURAL_IMPACT:
        record = {
            "content_type": c["content_type"],
            "title": c["title"],
            "year": c.get("year"),
            "author": c.get("author"),
            "editorial_note": c["editorial_note"],
            "external_url": c.get("external_url"),
            "link_level": c.get("link_level", "direct")
        }
        if "match_slug" in c:
            match_id = get_match_id(c["match_slug"])
            if not match_id:
                print(f"  SKIP cultural: match not found — {c['match_slug']}")
                continue
            record["match_id"] = match_id
        elif "player_slug" in c:
            player_id = get_player_id(c["player_slug"])
            if not player_id:
                print(f"  SKIP cultural: player not found — {c['player_slug']}")
                continue
            record["player_id"] = player_id
        supabase.table("cultural_impact").upsert(record).execute()
        seeded += 1
    print(f"Seeded {seeded}/{len(CULTURAL_IMPACT)} cultural impact items")

if __name__ == "__main__":
    print("Seeding editorial content...")
    seed_literary_voices()
    seed_cultural_impact()
    print("Done.")
```

---

## Area Admin — `/admin`

### Protezione
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const auth = request.cookies.get('admin_auth')
    if (!auth || auth.value !== process.env.ADMIN_PASSWORD) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }
}
```

### Pagina `/admin/partite/[slug]` — sezioni

**1. Header** (read-only, dati Sackmann): titolo, punteggio, torneo, data, round

**2. Stato**: Pubblicata / Bozza / Da completare · In evidenza questa settimana · indicatori presenza video, citazioni, cultura

**3. Video YouTube**: campo `youtube_video_id` editabile · selezione canale · anteprima embed · pulsante "Cerca automaticamente"

**4. Foto giocatori** (si salvano su tabella `players`, non `matches`): upload URL + attribuzione per ciascun giocatore. Fonti suggerite: Wikimedia Commons, International Tennis Hall of Fame, URL esterno

**5. Voci letterarie** (`literary_voices`): lista voci pre-caricate dal seed · modifica singola voce · "+ Aggiungi voce" · campo lingua · avviso max 300 caratteri, una sola frase, link obbligatorio

**6. Impatto culturale** (`cultural_impact`): lista voci pre-caricate dal seed con badge colorati per tipo · modifica · "+ Aggiungi" con form completo · elimina

**7. Nota interna**: textarea libera, non visibile sul sito

### Badge tipi contenuto
```typescript
const TYPE_CONFIG = {
  film:        { label: '🎬 Film',          bg: '#E6F1FB', color: '#185FA5' },
  book:        { label: '📚 Libro',          bg: '#EEEDFE', color: '#534AB7' },
  music:       { label: '🎵 Musica',         bg: '#FBF4E3', color: '#854F0B' },
  article:     { label: '📰 Articolo',       bg: '#EAF3DE', color: '#3B6D11' },
  ad:          { label: '📺 Pubblicità',     bg: '#F3EFF8', color: '#6B4FA3' },
  documentary: { label: '🎙️ Documentario',  bg: '#FCEBEB', color: '#993C1D' },
  artwork:     { label: '🖼️ Opera d\'arte',  bg: '#FFF8E6', color: '#7A5A00' },
  photo:       { label: '📷 Fotografia',     bg: '#F0F0F0', color: '#555555' },
  other:       { label: '💬 Altro',          bg: '#F5F5F5', color: '#666666' },
}
```

---

## Scheda partita pubblica — componenti aggiuntivi

```tsx
// components/LiteraryVoices.tsx
export function LiteraryVoices({ voices }: { voices: LiteraryVoice[] }) {
  if (!voices.length) return null
  return (
    <section>
      <h2 className="section-label">Le voci narranti</h2>
      {voices.map(v => (
        <div key={v.id} className="voice-card">
          <div className="voice-header">
            <div className="voice-monogram">
              {v.author.split(' ').map(w => w[0]).join('').slice(0,2)}
            </div>
            <div>
              <p className="voice-author">{v.author}</p>
              <p className="voice-pub">{v.publication}{v.pub_date ? ` · ${formatDate(v.pub_date)}` : ''}</p>
            </div>
          </div>
          <blockquote className="voice-quote">"{v.excerpt}"</blockquote>
          {v.article_url && (
            <a href={v.article_url} target="_blank" rel="noopener noreferrer">
              Leggi l'articolo completo →
            </a>
          )}
          <p className="voice-attribution">{v.attribution}</p>
        </div>
      ))}
    </section>
  )
}

// components/CulturalImpact.tsx
export function CulturalImpact({ items }: { items: CulturalImpactItem[] }) {
  if (!items.length) return null
  return (
    <section>
      <h2 className="section-label">Impatto culturale</h2>
      <p className="section-sub">Film, libri, spot, documentari e momenti storici legati a questa partita</p>
      {items.map(item => (
        <div key={item.id} className="cultural-item">
          <span className="type-badge" style={getBadgeStyle(item.content_type)}>
            {TYPE_CONFIG[item.content_type].label}
          </span>
          <div className="cultural-title">
            {item.title}
            {item.year && <span className="cultural-year"> ({item.year})</span>}
          </div>
          {item.author && <div className="cultural-author">{item.author}</div>}
          <p className="cultural-note">{item.editorial_note}</p>
          {item.external_url && (
            <a href={item.external_url} target="_blank" rel="noopener noreferrer">
              Approfondisci →
            </a>
          )}
        </div>
      ))}
    </section>
  )
}
```

---

## Import dati Sackmann

`scripts/import_sackmann.py` — scarica CSV da GitHub per anni 1993–1997, importa in Supabase, genera slug automatici `{player1}-{player2}-{tournament}-{year}-{round}`.

Attribuzione footer obbligatoria:
```
Dati: Jeff Sackmann / Tennis Abstract (CC-BY-NC-SA 4.0) — github.com/JeffSackmann/tennis_atp
```

---

## Matching YouTube

Cron job `app/api/cron/youtube-match/route.ts` — cerca su canali ufficiali:
- US Open: `UCkBSdkMpwSdJNRQb5aRkJwA`
- Australian Open: `UCMKoSCkD0gMi1HYbZ5ZtLnQ`
- Roland Garros: canale FFT ufficiale

Embed sempre con `youtube-nocookie.com`. Fallback elegante per Wimbledon (nessun archivio disponibile).

---

## Google Tag Manager

GTM ID: `GTM-XXXXXXX` (da sostituire).

`lib/analytics.ts`:
```typescript
export const trackNewsletterSignup = (source: string) =>
  pushEvent('newsletter_signup', { newsletterSource: source })
export const trackVideoPlay = (videoId: string, matchTitle: string, tournament: string, year: number) =>
  pushEvent('video_play', { videoId, matchTitle, tournamentName: tournament, matchYear: year })
export const trackClericiClick = (matchSlug: string, matchTitle: string) =>
  pushEvent('clerici_link_click', { matchSlug, matchTitle })
export const trackCulturalClick = (matchSlug: string, itemTitle: string, contentType: string) =>
  pushEvent('cultural_click', { matchSlug, itemTitle, contentType })
```

---

## SEO

```
title: "{Vincitore} b. {Perdente} {score} | {Torneo} {Anno} | Ace Chronicle"
description: "Statistiche, video e la voce di Gianni Clerici su {Torneo} {Anno} tra {Vincitore} e {Perdente}."
```

OG image dinamica con Vercel OG: sfondo `#F5F2EB`, Bebas Neue, punteggio, logo.

---

## Footer — attribuzioni obbligatorie

```
Dati statistici: Jeff Sackmann / Tennis Abstract (CC-BY-NC-SA 4.0) — github.com/JeffSackmann/tennis_atp
Testi: © La Repubblica / GEDI · © Esquire / Hearst — citazioni per fini culturali ex art. 70 L. 633/1941
Video: canali YouTube ufficiali US Open (USTA), Australian Open, Roland Garros
Fase 1 · Non commerciale
```

---

## Ordine di sviluppo

1. Setup Next.js + Vercel + Supabase + schema DB completo
2. `import_sackmann.py` — anni 1993–1997
3. `seed_editorial.py` — literary_voices + cultural_impact pre-compilati
4. Design system: variabili CSS, font, componenti base
5. Homepage con 10 partite in evidenza
6. Scheda partita pubblica (stats + video + voci + cultura)
7. Profilo giocatore con foto
8. Area admin `/admin` completa
9. Cron job YouTube
10. GTM + GA4
11. Newsletter Beehiiv
12. SEO: meta tag + sitemap + OG image
13. Import esteso 1985–2000

---

## Note finali

- Esegui `seed_editorial.py` DOPO `import_sackmann.py`
- Gli estratti Clerici nel seed sono vuoti — l'admin li aggiunge manualmente cercando su `ricerca.repubblica.it`
- Tutti i numeri statistici: `font-variant-numeric: tabular-nums`
- Video embed: sempre `youtube-nocookie.com`, mai `youtube.com`
- Admin password: variabile d'ambiente `ADMIN_PASSWORD`
- Non usare `localStorage` o `sessionStorage`
- Commit frequenti — Vercel fa deploy automatico da `main`
