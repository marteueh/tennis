/**
 * Migrazione cultural_impacts v2 — player_ids[] e match_ids[] (array)
 * Aggiunge giocatori mancanti + partite chiave fuori archivio 1993-1997
 * Uso: node database/migrate_cultural_impact.mjs
 */
import postgres from 'postgres'

const db = postgres(process.env.DATABASE_URL, { max: 1 })

// Ricrea la tabella con schema v2 (array invece di FK singole)
await db`DROP TABLE IF EXISTS cultural_impacts CASCADE`
await db`
  CREATE TABLE cultural_impacts (
    id             SERIAL PRIMARY KEY,
    type           TEXT NOT NULL CHECK (type IN ('book','film','documentary','ad','article','quote','moment')),
    emoji          TEXT,
    title          TEXT NOT NULL,
    year           SMALLINT,
    author         TEXT,
    body           TEXT NOT NULL,
    url            TEXT,
    match_ids      INTEGER[] NOT NULL DEFAULT '{}',
    player_ids     INTEGER[] NOT NULL DEFAULT '{}',
    tournament_id  INTEGER REFERENCES tournaments(id) ON DELETE SET NULL,
    link_level     TEXT NOT NULL DEFAULT 'contextual'
                     CHECK (link_level IN ('direct','contextual','archetypal'))
  )
`
console.log('✓ Tabella cultural_impacts ricreata (schema v2: array)')

// ── Lookup helpers ────────────────────────────────────────────────────────────
async function matchId(slug) {
  const r = await db`SELECT id FROM matches WHERE slug = ${slug} LIMIT 1`
  return r[0]?.id ?? null
}
async function playerId(slug) {
  const r = await db`SELECT id FROM players WHERE slug = ${slug} LIMIT 1`
  return r[0]?.id ?? null
}
async function tournamentId(slug) {
  const r = await db`SELECT id FROM tournaments WHERE slug = ${slug} LIMIT 1`
  return r[0]?.id ?? null
}
function ids(...vals) {
  return vals.filter(v => v !== null)
}

// ── 1. Giocatori mancanti (non nel dataset Sackmann 1993-1997) ───────────────
const missingPlayers = [
  { slug: 'bjorn-borg',   first_name: 'Bjorn',  last_name: 'Borg',    country_code: 'SWE', hand: 'R', birth_date: '1956-06-06', height_cm: 180, atp_peak_rank: 1, grand_slams: 11, active_from: 1973, active_to: 1983 },
  { slug: 'john-mcenroe', first_name: 'John',   last_name: 'McEnroe', country_code: 'USA', hand: 'L', birth_date: '1959-02-16', height_cm: 180, atp_peak_rank: 1, grand_slams: 7,  active_from: 1978, active_to: 1992 },
  { slug: 'monica-seles', first_name: 'Monica', last_name: 'Seles',   country_code: 'USA', hand: 'L', birth_date: '1973-12-02', height_cm: 172, atp_peak_rank: 1, grand_slams: 9,  active_from: 1989, active_to: 2008 },
]
for (const p of missingPlayers) {
  const exists = await db`SELECT id FROM players WHERE slug = ${p.slug} LIMIT 1`
  if (!exists[0]) {
    await db`
      INSERT INTO players (slug, first_name, last_name, country_code, hand, birth_date, height_cm, atp_peak_rank, grand_slams, active_from, active_to, sackmann_id)
      VALUES (${p.slug}, ${p.first_name}, ${p.last_name}, ${p.country_code}, ${p.hand}, ${p.birth_date}, ${p.height_cm}, ${p.atp_peak_rank}, ${p.grand_slams}, ${p.active_from}, ${p.active_to}, NULL)
    `
    console.log(`  ✓ Giocatore aggiunto: ${p.first_name} ${p.last_name}`)
  } else {
    console.log(`  · Già presente: ${p.first_name} ${p.last_name}`)
  }
}

// ── 2. Partite chiave fuori archivio (1993-1997) ─────────────────────────────
const wimbledonTId  = await tournamentId('wimbledon')
const rgTId         = await tournamentId('roland-garros')

const borgId        = await playerId('bjorn-borg')
const mcenroeId     = await playerId('john-mcenroe')
const changId       = await playerId('michael-chang')
const lendlId       = await playerId('ivan-lendl')
const ivanisevicId  = await playerId('goran-ivanisevic')
const rafterId      = await playerId('patrick-rafter')

const keyMatches = [
  {
    slug: 'bjorn-borg-vs-john-mcenroe-wimbledon-1980-f',
    tournament_id: wimbledonTId, year: 1980, match_date: '1980-07-05',
    round: 'F', surface: 'Grass', winner_id: borgId, loser_id: mcenroeId,
    score: '1-6 7-5 6-3 6-7 8-6',
  },
  {
    slug: 'michael-chang-vs-ivan-lendl-roland-garros-1989-r16',
    tournament_id: rgTId, year: 1989, match_date: '1989-06-05',
    round: 'R16', surface: 'Clay', winner_id: changId, loser_id: lendlId,
    score: '4-6 4-6 6-3 6-3 6-3',
  },
  {
    slug: 'goran-ivanisevic-vs-patrick-rafter-wimbledon-2001-f',
    tournament_id: wimbledonTId, year: 2001, match_date: '2001-07-09',
    round: 'F', surface: 'Grass', winner_id: ivanisevicId, loser_id: rafterId,
    score: '6-3 3-6 6-3 2-6 9-7',
  },
]
for (const m of keyMatches) {
  const exists = await db`SELECT id FROM matches WHERE slug = ${m.slug} LIMIT 1`
  if (!exists[0]) {
    await db`
      INSERT INTO matches (slug, tournament_id, year, match_date, round, surface, winner_id, loser_id, score, sackmann_id, featured, featured_week)
      VALUES (${m.slug}, ${m.tournament_id}, ${m.year}, ${m.match_date}, ${m.round}, ${m.surface}, ${m.winner_id}, ${m.loser_id}, ${m.score}, NULL, false, NULL)
    `
    console.log(`  ✓ Partita aggiunta: ${m.slug}`)
  } else {
    console.log(`  · Già presente: ${m.slug}`)
  }
}

// ── 3. Lookup ID tornei e partite ─────────────────────────────────────────────
const wimbledon    = await tournamentId('wimbledon')
const usOpen       = await tournamentId('us-open')
const ausOpen      = await tournamentId('australian-open')
const rolandGarros = await tournamentId('roland-garros')

const sampras      = await playerId('pete-sampras')
const agassi       = await playerId('andre-agassi')
const becker       = await playerId('boris-becker')
const ivanisevic   = await playerId('goran-ivanisevic')
const rafter       = await playerId('patrick-rafter')
const chang        = await playerId('michael-chang')
const lendl        = await playerId('ivan-lendl')
const henman       = await playerId('tim-henman')
const joyce        = await playerId('michael-joyce')
const borg         = await playerId('bjorn-borg')
const mcenroe      = await playerId('john-mcenroe')
const seles        = await playerId('monica-seles')

const usOpen1995     = await matchId('pete-sampras-vs-andre-agassi-us-open-1995-f')
const wimbledon1980F = await matchId('bjorn-borg-vs-john-mcenroe-wimbledon-1980-f')
const changLendl1989 = await matchId('michael-chang-vs-ivan-lendl-roland-garros-1989-r16')
const wimbledon2001F = await matchId('goran-ivanisevic-vs-patrick-rafter-wimbledon-2001-f')

console.log('Partite — usOpen1995:', usOpen1995, '| wimbledon1980F:', wimbledon1980F, '| changLendl1989:', changLendl1989, '| wimbledon2001F:', wimbledon2001F)

// ── 4. Seed ───────────────────────────────────────────────────────────────────
const items = [
  // ── CLUSTER 1: Sampras vs Agassi ─────────────────────────────────────────
  {
    type: 'ad', emoji: '📺', title: 'Nike "Guerrilla Tennis"', year: 1995,
    author: 'Spike Jonze / Wieden+Kennedy',
    body: 'Sampras e Agassi escono da un taxi a San Francisco, montano una rete in mezzo al traffico e si sfidano finché un autobus la distrugge. Primo spot Nike in cui entrambi compaiono insieme. Diretto da Spike Jonze reduce da "Sabotage" dei Beastie Boys. Silver Lion a Cannes. Nel 2015 rifatto a New York con Federer, Nadal, Serena, McEnroe e Sharapova.',
    url: 'https://www.youtube.com/results?search_query=nike+guerrilla+tennis+1995+sampras+agassi',
    match_ids: ids(), player_ids: ids(sampras, agassi), tournament_id: usOpen, link_level: 'contextual',
  },
  {
    // "Open" contiene il resoconto esplicito della finale US Open 1995
    type: 'book', emoji: '📚', title: '"Open" — Andre Agassi', year: 2009,
    author: 'Andre Agassi con J.R. Moehringer',
    body: 'Bestseller mondiale, uno dei migliori libri sportivi mai scritti. Prima pagina: "Odio il tennis, lo odio con tutto il cuore, eppure continuo a giocare." Contiene il resoconto dettagliato della finale US Open 1995 — Agassi descrive come quella sconfitta lo abbia distrutto per due anni. Controverso per le critiche a Sampras ("un dollaro di mancia"), a Chang e Becker.',
    url: 'https://www.goodreads.com/book/show/6480781-open',
    match_ids: ids(usOpen1995), player_ids: ids(agassi), tournament_id: null, link_level: 'direct',
  },
  {
    // "A Champion's Mind" cita esplicitamente la vittoria del 1995
    type: 'book', emoji: '📚', title: '"A Champion\'s Mind" — Pete Sampras', year: 2008,
    author: 'Pete Sampras con Peter Bodo',
    body: 'Risposta implicita all\'"Open" di Agassi. Sampras scrive che la vittoria del 1995 ebbe "un effetto devastante su Andre" e che lo tenne fuori dalla competizione per due anni. Tono riservato, quasi clinico — il contrario del memoir di Agassi.',
    url: 'https://www.goodreads.com/book/show/3044956-a-champion-s-mind',
    match_ids: ids(usOpen1995), player_ids: ids(sampras), tournament_id: null, link_level: 'direct',
  },
  {
    // Wallace segue Joyce alle qualificazioni e all'US Open 1995 — parla del torneo, non della finale
    type: 'article', emoji: '🎙️', title: '"Tennis Player Michael Joyce\'s Professional Artistry…" — David Foster Wallace', year: 1996,
    author: 'David Foster Wallace (Esquire, luglio 1996)',
    body: 'Il saggio più celebre sul tennis degli anni \'90. Wallace segue Joyce (79° al mondo) nelle qualificazioni del Canadian Open 1995 e poi all\'US Open. "Tennis is the most beautiful sport there is, and also the most demanding." Agassi e Sampras appaiono come sfondo onnipresente — irraggiungibili, quasi mitologici.',
    url: 'https://www.esquire.com/sports/a5151/the-string-theory-0796/',
    match_ids: ids(), player_ids: ids(joyce), tournament_id: usOpen, link_level: 'contextual',
  },
  {
    type: 'article', emoji: '🎙️', title: '"Democracy and Commerce at the U.S. Open" — David Foster Wallace', year: 1996,
    author: 'David Foster Wallace (Tennis Magazine, 1996)',
    body: 'Wallace descrive l\'atmosfera commerciale e caotica di Flushing Meadows — hotdog, sponsor, folla rumorosa — in contrasto con il silenzio reverenziale di Wimbledon. Courier, Sampras, Agassi appaiono come personaggi sfondo. Raccolto in "String Theory" (Library of America, 2016).',
    url: null,
    match_ids: ids(), player_ids: ids(), tournament_id: usOpen, link_level: 'contextual',
  },
  // ── CLUSTER 2: Borg vs McEnroe, Wimbledon 1980 ───────────────────────────
  {
    type: 'film', emoji: '🎬', title: '"Borg McEnroe"', year: 2017,
    author: 'Regia: Janus Metz. Cast: Sverrir Gudnason, Shia LaBeouf',
    body: 'Film sulla finale di Wimbledon 1980 con il leggendario tie-break del quarto set (18-16). La narrativa ghiaccio vs. fuoco (Borg metodico, McEnroe esplosivo) è l\'archetipo che i media usarono per Sampras vs Agassi negli anni \'90. Clerici scrisse della finale 1980 come della "partita più bella mai giocata".',
    url: 'https://www.imdb.com/title/tt4399460/',
    match_ids: ids(wimbledon1980F), player_ids: ids(borg, mcenroe), tournament_id: wimbledon, link_level: 'archetypal',
  },
  // ── CLUSTER 3: Chang vs Lendl, Roland Garros 1989 ───────────────────────
  {
    type: 'documentary', emoji: '🎙️', title: '"Iconic Moments: Chang vs Lendl, Roland Garros 1989" — Roland Garros Official', year: 2022,
    author: 'Roland Garros / FFT',
    body: 'Mini-documentario ufficiale che ricostruisce la partita con footage originale e interviste. Chang racconta il servizio da sotto: "Ero sotto 15-30, dovevo fare qualcosa di diverso. Ho servito da sotto tanto per vedere l\'effetto che faceva." Lendl non commentò mai la sconfitta pubblicamente.',
    url: 'https://www.youtube.com/watch?v=u0NkCiZsAJ4',
    match_ids: ids(changLendl1989), player_ids: ids(chang, lendl), tournament_id: rolandGarros, link_level: 'direct',
  },
  {
    type: 'quote', emoji: '💬', title: '"Davide contro Golia con una banana al posto della fionda"', year: 1989,
    author: 'Narrativa giornalistica diffusa',
    body: 'La partita Chang–Lendl 1989 ha generato una delle metafore sportive più usate degli anni \'90 — il bambino che batte il gigante con armi improprie. Il servizio da sotto è diventato simbolo di creatività tattica sotto pressione. Ancora oggi citata nei manuali di psicologia sportiva come esempio di problem solving sotto stress estremo.',
    url: null,
    match_ids: ids(changLendl1989), player_ids: ids(chang, lendl), tournament_id: rolandGarros, link_level: 'contextual',
  },
  // ── CLUSTER 4: Ivanisevic vs Rafter, Wimbledon 2001 ─────────────────────
  {
    type: 'film', emoji: '🎬', title: '"Wimbledon" (film)', year: 2004,
    author: 'Regia: Richard Loncraine. Con Paul Bettany e Kirsten Dunst',
    body: 'Commedia romantica esplicitamente ispirata alla vittoria di Ivanisevic nel 2001. Il protagonista è un tennista in declino che ottiene una wild card e vince contro ogni pronostico. Mediocre come film, ma documento culturale: dimostra quanto quella vittoria avesse penetrato l\'immaginario collettivo al punto da diventare soggetto di una rom-com hollywoodiana.',
    url: 'https://www.imdb.com/title/tt0360201/',
    match_ids: ids(wimbledon2001F), player_ids: ids(ivanisevic, rafter), tournament_id: wimbledon, link_level: 'direct',
  },
  {
    type: 'documentary', emoji: '🎙️', title: '"Wimbledon Official Film 2001"', year: 2001,
    author: 'Wimbledon / AELTC',
    body: 'Il film ufficiale del torneo — rating 9.3/10 su IMDb, uno dei documentari sportivi più emozionanti mai realizzati. Cattura il "People\'s Monday" — la finale spostata al lunedì — con migliaia di biglietti distribuiti al pubblico generale. Ivanisevic che si arrampica nel box della famiglia dopo il match point è una delle immagini più iconiche del tennis moderno.',
    url: 'https://www.imdb.com/title/tt1845324/',
    match_ids: ids(wimbledon2001F), player_ids: ids(ivanisevic, rafter), tournament_id: wimbledon, link_level: 'direct',
  },
  {
    type: 'moment', emoji: '💬', title: '"People\'s Monday" — la finale spostata', year: 2001,
    author: 'Stampa internazionale, luglio 2001',
    body: 'La pioggia che ritardò la semifinale Ivanisevic-Henman creò il "People\'s Monday" — la prima finale di Wimbledon giocata di lunedì dalla Seconda Guerra Mondiale. Biglietti extra messi in vendita. Atmosfera paragonata a una partita di calcio. Ivanisevic disse: "Il pubblico era come se stesse assistendo a una partita di rugby." Henman Hill divenne Henman Mountain per un giorno.',
    url: null,
    match_ids: ids(wimbledon2001F), player_ids: ids(ivanisevic, henman), tournament_id: wimbledon, link_level: 'direct',
  },
  // ── CLUSTER 5: Agassi, Wimbledon 1992 ───────────────────────────────────
  {
    type: 'ad', emoji: '📺', title: 'Canon "Image is Everything" — Andre Agassi', year: 1992,
    author: 'Canon',
    body: 'Lo spot che rese Agassi un\'icona pop prima ancora che vincesse Wimbledon. Il claim "Image is Everything" fu rivolto contro di lui per anni dai media che lo accusavano di sostanza senza stile. Paradossalmente, quando vinse Wimbledon 1992 con il parrucchino e i jeans shorts, dimostrò che immagine e sostanza potevano coesistere. Agassi nell\'autobiografia: "quella pubblicità mi ha perseguitato per anni."',
    url: null,
    match_ids: ids(), player_ids: ids(agassi), tournament_id: wimbledon, link_level: 'direct',
  },
  // ── CLUSTER 6: Becker, Wimbledon 1985 ───────────────────────────────────
  {
    type: 'documentary', emoji: '🎙️', title: '"Boris Becker: The Champ" (Netflix)', year: 2023,
    author: 'Netflix / Lorton Entertainment',
    body: 'Docuserie in 2 episodi prodotta mentre Becker era in carcere per bancarotta fraudolenta. Interviste con Djokovic, McEnroe, Stich. Ripercorre la finale 1985 contro Curren — Becker 17 anni, primo non testa di serie a vincere Wimbledon — come punto di partenza dell\'"era teenager" nel tennis.',
    url: 'https://www.netflix.com/title/81316663',
    match_ids: ids(), player_ids: ids(becker), tournament_id: wimbledon, link_level: 'contextual',
  },
  // ── CLUSTER 7: Il pianto di Sampras (Australian Open 1995 SF) ────────────
  {
    // Avvenne nella SF vs Courier, non nella finale vs Agassi — no match_id specifico nell'archivio
    type: 'moment', emoji: '💬', title: 'Il pianto di Sampras per Tim Gullikson', year: 1995,
    author: 'Australian Open 1995, Semifinale vs Chang',
    body: 'Sampras scoppiò in lacrime durante la semifinale con Chang dopo aver saputo che il suo allenatore Tim Gullikson aveva un tumore al cervello terminale. Vinse comunque la semifinale e poi la finale su Agassi. Questo momento trasformò la sua immagine pubblica — da robot freddo a essere umano vulnerabile. Agassi racconta nell\'autobiografia che quella vittoria di Sampras "con le lacrime agli occhi" fu quasi impossibile da guardare.',
    url: null,
    match_ids: ids(), player_ids: ids(sampras), tournament_id: ausOpen, link_level: 'contextual',
  },
  // ── CLUSTER 8: Seles, Amburgo 1993 ──────────────────────────────────────
  {
    type: 'moment', emoji: '💬', title: 'L\'accoltellamento di Monica Seles, Amburgo 1993', year: 1993,
    author: 'Evento storico',
    body: 'Il 30 aprile 1993, Monica Seles venne accoltellata alla schiena durante un cambio di campo. Non tornò alle competizioni per due anni. L\'episodio scosse il tennis mondiale e portò a riforme sulla sicurezza dei giocatori. La Graf poi ammise che quel periodo senza Seles le "tolse valore" alle vittorie successive.',
    url: null,
    match_ids: ids(), player_ids: ids(seles), tournament_id: rolandGarros, link_level: 'archetypal',
  },
  // ── CLUSTER 9: Rafter ────────────────────────────────────────────────────
  {
    type: 'moment', emoji: '💬', title: 'Patrick Rafter — l\'ultimo grande serve-and-volleyer', year: 2001,
    author: 'Narrativa sportiva internazionale',
    body: 'Rafter fu ampiamente descritto come "l\'ultimo dei mohicani" del serve-and-volley — uno stile di gioco che morì con lui nel tour. La sua rivalità con Agassi (amici nella vita, avversari in campo) e la perdita della finale di Wimbledon 2001 furono narrate come la fine di un\'epoca. Clerici lo definì "il più elegante tra i campioni degli anni \'90".',
    url: null,
    match_ids: ids(wimbledon2001F), player_ids: ids(rafter), tournament_id: wimbledon, link_level: 'contextual',
  },
]

for (const item of items) {
  await db`
    INSERT INTO cultural_impacts
      (type, emoji, title, year, author, body, url, match_ids, player_ids, tournament_id, link_level)
    VALUES
      (${item.type}, ${item.emoji}, ${item.title}, ${item.year ?? null}, ${item.author ?? null},
       ${item.body}, ${item.url ?? null}, ${item.match_ids}, ${item.player_ids},
       ${item.tournament_id ?? null}, ${item.link_level})
  `
  console.log(`  ✓ [${item.emoji}] ${item.title.slice(0, 60)}`)
}

console.log(`\n✓ ${items.length} voci culturali inserite`)
await db.end()
