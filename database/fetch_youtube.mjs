/**
 * fetch_youtube.mjs
 *
 * Quattro flussi di ricerca su YouTube (selezionabili via --mode):
 *
 *   MODE matches (default) — per ogni partita featured cerca:
 *     1. MAIN     → telecronaca originale (youtube_video_id, ...)
 *     2. TOMMASI  → telecronaca italiana Tommasi/Clerici (youtube_tommasi_id, ...)
 *
 *   MODE deep — secondo passaggio AGGRESSIVO sulle partite per cui il mode
 *   matches non ha trovato nulla. Usa 3 varianti di query, controlla anche
 *   la descrizione del video (non solo il titolo), e accetta video con un
 *   solo giocatore nel titolo se anno + torneo sono presenti. Pensato per
 *   recuperare upload amatoriali con titoli generici ("Wimbledon 1985 Final").
 *
 *   MODE commercials — per ogni giocatore top cerca spot pubblicitari (Nike,
 *   Canon, Pepsi, Volvo, Diadora, FILA…) e li salva in cultural_impacts con
 *   type='ad', collegati al giocatore.
 *
 * Comportamento incrementale (tutti i mode):
 *  - Default: salta entità già processate (campi *_searched_at NOT NULL)
 *  - --retry  : ricontrolla anche le già provate senza esito
 *  - --all    : ricontrolla TUTTE
 *
 * Uso:
 *   node database/fetch_youtube.mjs                           → matches (default)
 *   node database/fetch_youtube.mjs --mode deep               → ricerca aggressiva
 *   node database/fetch_youtube.mjs --mode commercials        → spot per top player
 *   node database/fetch_youtube.mjs --skip-tommasi            → matches senza tommasi
 *   node database/fetch_youtube.mjs --mode deep --limit 25    → deep, max 25 partite
 *   node database/fetch_youtube.mjs --year-from 1985 --year-to 1990 --limit 40
 */

import postgres from 'postgres'

const DRY_RUN      = process.argv.includes('--dry-run')
const ALL          = process.argv.includes('--all')
const RETRY        = process.argv.includes('--retry')        // riprova anche i già cercati senza esito
const SKIP_TOMMASI = process.argv.includes('--skip-tommasi') // disabilita la ricerca italiana
const LIMIT     = (() => { const i = process.argv.indexOf('--limit');    return i >= 0 ? parseInt(process.argv[i+1]) : 200 })()
const ROUNDS    = (() => { const i = process.argv.indexOf('--rounds');   return i >= 0 ? process.argv[i+1].split(',') : ['F', 'SF', 'QF'] })()
const YEAR_FROM = (() => { const i = process.argv.indexOf('--year-from'); return i >= 0 ? parseInt(process.argv[i+1]) : null })()
const YEAR_TO   = (() => { const i = process.argv.indexOf('--year-to');   return i >= 0 ? parseInt(process.argv[i+1]) : null })()
const MODE      = (() => { const i = process.argv.indexOf('--mode');     return i >= 0 ? process.argv[i+1] : 'matches' })()
if (!['matches', 'commercials', 'deep'].includes(MODE)) {
  console.error(`❌  --mode deve essere 'matches', 'commercials' o 'deep' (ricevuto: '${MODE}')`)
  process.exit(1)
}

const YT_KEY = process.env.YOUTUBE_API_KEY
if (!YT_KEY) { console.error('❌  YOUTUBE_API_KEY mancante'); process.exit(1) }

const db = postgres(process.env.DATABASE_URL, { max: 1 })

// Channel ID ufficiali (verificati)
const OFFICIAL_CHANNELS = {
  'us-open':         'UCXbboag48Qlr78zzz6SkzkQ',  // US Open Tennis Championships
  'australian-open': 'UCeTKJSW1NTAkf27nNmjWt5A',  // Australian Open
  'roland-garros':   'UCF3K1Jf8hjFW8qliei8fQ3A',  // Roland-Garros
  'wimbledon':       'UCv09sB-NEFvCHDTW06gxjsw',  // Wimbledon (tasso archivio storico basso ma esiste)
}

// Canali di alta qualità (bonus score)
const TRUSTED_CHANNELS = new Set([
  'UCXbboag48Qlr78zzz6SkzkQ',  // US Open
  'UCeTKJSW1NTAkf27nNmjWt5A',  // Australian Open
  'UCF3K1Jf8hjFW8qliei8fQ3A',  // Roland-Garros
  'UCv09sB-NEFvCHDTW06gxjsw',  // Wimbledon
  'UCLbc3s-ksaPdfIXXzaJMXMQ',  // Roland-Garros (alt)
  'UCkBSdkMpwSdJNRQb5aRkJwA',  // US Open (vecchio ID)
  'UCMKoSCkD0gMi1HYbZ5ZtLnQ',  // Australian Open (vecchio ID)
  'UCsHzPhOcRzFpR1MCgBDKNEg',  // Roland Garros (vecchio ID)
])

// Parole-chiave indicative di telecronaca italiana storica
const ITALIAN_KEYWORDS = /\b(tommasi|clerici|tele\+|tele plus|sky\s+(tennis|sport)|supertennis|rai\s+sport)\b/i

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// Verifica se un videoId è già assegnato a un'altra partita come main video.
// Previene il cross-assignment: lo stesso video su più match diversi.
async function isVideoAlreadyUsed(videoId, exceptMatchId) {
  const rows = await db`
    SELECT id FROM matches
    WHERE youtube_video_id = ${videoId} AND id != ${exceptMatchId}
    LIMIT 1
  `
  return rows.length > 0
}

async function ytSearch(query, channelId = null) {
  const params = new URLSearchParams({
    part: 'snippet', q: query, type: 'video',
    maxResults: '10', key: YT_KEY,
    ...(channelId ? { channelId } : {}),
  })
  // Retry con backoff sugli errori TRANSITORI (vedi TRANSIENT_REASONS).
  // Su questo progetto la search.list ritorna a intermittenza un 403
  // 'accountDelegationForbidden' anche con chiave valida: riprovando a
  // distanza di qualche secondo la richiesta va a buon fine.
  for (let attempt = 0; ; attempt++) {
    const res  = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, { signal: AbortSignal.timeout(8000) })
    const data = await res.json()
    if (!data.error) return data.items ?? []

    const reason = data.error.errors?.[0]?.reason ?? null
    if (TRANSIENT_REASONS.has(reason) && attempt < 3) {
      await sleep(1500 * (attempt + 1))   // 1.5s → 3s → 4.5s
      continue
    }
    const err = new Error(`${data.error.message} (code ${data.error.code}${reason ? `, reason ${reason}` : ''})`)
    err.code   = data.error.code
    err.reason = reason
    throw err
  }
}

// Distingue un vero esaurimento quota (fatale: inutile insistere oggi) da un
// 403/errore isolato (transitorio: si salta l'elemento e si prosegue).
const QUOTA_REASONS = new Set(['quotaExceeded', 'dailyLimitExceeded'])
function isQuotaExhausted(e) { return QUOTA_REASONS.has(e.reason) }

// Reason transitorie: si riprova (con backoff) invece di fallire subito.
// 'accountDelegationForbidden' qui NON è un problema di delega account ma un
// 403 intermittente del progetto; gli altri sono limiti di frequenza/errori server.
const TRANSIENT_REASONS = new Set([
  'accountDelegationForbidden',
  'rateLimitExceeded', 'userRateLimitExceeded', 'backendError', 'internalError',
])

// Oltre questa soglia di errori NON-quota consecutivi si assume un problema
// sistemico (rete/permessi/progetto) e si interrompe per non sprecare chiamate.
const MAX_CONSECUTIVE_ERRORS = 5

function scoreResult(item, match) {
  const title = (item.snippet?.title ?? '').toLowerCase()
  const wLast = match.winner_name.split(' ').pop().toLowerCase()
  const lLast = match.loser_name.split(' ').pop().toLowerCase()
  const year  = String(match.year)

  const hasWinner = title.includes(wLast)
  const hasLoser  = title.includes(lLast)

  // Entrambi i giocatori devono essere nel titolo
  if (!hasWinner || !hasLoser) return 0

  // Reject: titolo cita un altro Slam o un torneo non-Slam (stessa logica del deep)
  const ourSlam = SLAM_PATTERNS[match.tournament_slug]
  const titleHasOurSlam = ourSlam ? ourSlam.test(title) : false
  for (const [slug, rx] of Object.entries(SLAM_PATTERNS)) {
    if (slug !== match.tournament_slug && rx.test(title) && !titleHasOurSlam) return 0
  }
  if (OTHER_TOURNAMENTS.test(title) && !titleHasOurSlam) return 0

  let score = 4  // base: entrambi i giocatori presenti
  if (title.includes(year)) score += 3
  if (title.match(/full\s*match|match\s+complet/i)) score += 2
  if (title.match(/highlights/i)) score += 1
  if (TRUSTED_CHANNELS.has(item.snippet?.channelId)) score += 3
  if (titleHasOurSlam) score += 2
  // Penalizza se il titolo menziona un anno diverso
  const yearInTitle = title.match(/\b(19|20)\d{2}\b/)
  if (yearInTitle && yearInTitle[0] !== year) score -= 4
  // Penalizza round sbagliato
  if (match.round === 'F' && title.match(/semi|quarter|quarterfinal|semifinal/i)) score -= 3
  return score
}

async function findVideo(match) {
  const query = `${match.winner_name} ${match.loser_name} ${match.tournament_name} ${match.year}`

  // 1. Prova sul canale ufficiale (se esiste)
  const channelId = OFFICIAL_CHANNELS[match.tournament_slug]
  let items = channelId ? await ytSearch(query, channelId) : []
  let scored = items.map(item => ({ item, score: scoreResult(item, match) }))

  // Verifica se l'ufficiale ha già un risultato forte (≥ 7 = entrambi giocatori + canale trusted + anno o full match)
  const bestOfficial = scored.length > 0
    ? [...scored].sort((a, b) => b.score - a.score)[0]
    : null

  // 2. Fallback globale se: nessun risultato ufficiale OR il miglior ufficiale è debole
  const STRONG_THRESHOLD = 7
  if (!bestOfficial || bestOfficial.score < STRONG_THRESHOLD) {
    const globalItems = await ytSearch(query)
    const globalScored = globalItems.map(item => ({ item, score: scoreResult(item, match) }))
    scored = [...scored, ...globalScored]
  }

  if (scored.length === 0) return null

  // Scegli il risultato con punteggio più alto (e dedup per videoId)
  const seen = new Set()
  const dedup = scored.filter(s => {
    const id = s.item.id?.videoId
    if (!id || seen.has(id)) return false
    seen.add(id)
    return true
  })
  dedup.sort((a, b) => b.score - a.score)

  const best = dedup[0]
  if (!best || best.score < 4) return null  // entrambi i giocatori devono essere nel titolo

  return {
    videoId: best.item.id.videoId,
    title: best.item.snippet?.title ?? '',
    channel: best.item.snippet?.channelTitle ?? '',
  }
}

// ── Telecronaca italiana (Tommasi / Clerici) ──────────────────────────────

function scoreItalian(item, match) {
  const title    = (item.snippet?.title ?? '').toLowerCase()
  const desc     = (item.snippet?.description ?? '').toLowerCase()
  const haystack = `${title} ${desc}`
  const wLast = match.winner_name.split(' ').pop().toLowerCase()
  const lLast = match.loser_name.split(' ').pop().toLowerCase()
  const year  = String(match.year)

  // Requisiti hard: nomi + keyword italiana + ANNO ESATTO nel titolo
  // (i due giocatori spesso si sono affrontati in più anni, quindi l'anno è critico
  //  per evitare cross-assignment dello stesso video a partite diverse)
  if (!title.includes(wLast) || !title.includes(lLast)) return 0
  if (!ITALIAN_KEYWORDS.test(haystack)) return 0
  if (!title.includes(year)) return 0

  // Se nel titolo c'è un altro anno (diverso), rifiuta
  const yearMatches = title.match(/\b(19|20)\d{2}\b/g) ?? []
  if (yearMatches.length > 0 && !yearMatches.includes(year)) return 0

  // Bonus turno per finali (raramente confusi, ma utile)
  if (match.round === 'F' && /finale|final\b/i.test(haystack)) {
    // ok, neutro
  } else if (match.round === 'F' && /\bsemi|quarti|quarter|semi-?final|qf|sf\b/i.test(title)) {
    return 0  // titolo dice SF/QF ma è una F: scarta
  } else if ((match.round === 'SF' || match.round === 'QF') && /\bfinale\b/i.test(title) && !/semifinale|quarti/i.test(title)) {
    return 0  // titolo dice "Finale" ma noi cerchiamo SF/QF: scarta
  }

  let score = 7  // base: anno + nomi + keyword italiana
  if (/tommasi/i.test(haystack) && /clerici/i.test(haystack)) score += 4   // duo conclamato
  else if (/tommasi/i.test(haystack) || /clerici/i.test(haystack)) score += 2
  if (/telecronaca|cronaca italiana|commento italiano|in italiano/i.test(haystack)) score += 3
  if (/tele\s*\+|tele plus|sky\s+(tennis|sport)|supertennis/i.test(haystack)) score += 2
  return score
}

async function findItalianVideo(match) {
  const wLast = match.winner_name.split(' ').pop()
  const lLast = match.loser_name.split(' ').pop()
  // Query mirata: nomi + Tommasi/Clerici come parole chiave
  const query = `${wLast} ${lLast} ${match.year} Tommasi Clerici telecronaca`
  const items = await ytSearch(query)
  if (items.length === 0) return null

  const scored = items
    .map(item => ({ item, score: scoreItalian(item, match) }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)

  const best = scored[0]
  if (!best || best.score < 6) return null  // soglia più alta dell'inglese (filtro più severo)

  return {
    videoId: best.item.id.videoId,
    title: best.item.snippet?.title ?? '',
    channel: best.item.snippet?.channelTitle ?? '',
  }
}

// ── Ricerca DEEP — passaggio aggressivo per partite non trovate ─────────────

// Parole che indicano contenuto NON pertinente (da scartare in deep)
const DEEP_REJECT = /\b(atp\s*tour\s*finals|year\s*end|compilation|top\s*\d+|best\s*of|all\s*the|every|tribute|montage|career|documentary|interview)\b/i

// Pattern per identificare i 4 Slam nel titolo.
// NB: niente \b finale — titoli come "wimbledon94" o "rolandgarros02"
// devono comunque essere riconosciuti.
const SLAM_PATTERNS = {
  'australian-open': /australian\s*open|aus(\.|tralian)?\s*open|melbourne/i,
  'roland-garros':   /roland[- ]?garros|french\s*open|parigi|\bparis/i,
  'wimbledon':       /wimbledon/i,
  'us-open':         /\bus\s*open|u\.s\.?\s*open|flushing/i,
}

// Tornei NON-Slam: se citati nel titolo, il video non è del nostro match Slam
const OTHER_TOURNAMENTS = /\b(barcelona|barcellona|rome|roma|monte[- ]?carlo|miami|indian wells|hamburg|amburgo|cincinnati|montreal|toronto|key biscayne|stuttgart|bercy|paris masters|masters cup|atp finals|tour finals|davis cup|coppa davis|olympic|olimpiad|queen'?s|halle|rotterdam|dubai|memphis|estoril|munich|monaco di baviera|gstaad|kitzbuhel|umag|washington|tokyo|beijing|shanghai|vienna|stoccolma|stockholm|lyon|lione|antwerp|anversa|milano|essen|philadelphia|grand slam cup|hopman cup|world team cup)\b/i

function scoreResultDeep(item, match) {
  const title = (item.snippet?.title ?? '').toLowerCase()
  const desc  = (item.snippet?.description ?? '').toLowerCase()
  const hay   = `${title} ${desc}`
  const wLast = match.winner_name.split(' ').pop().toLowerCase()
  const lLast = match.loser_name.split(' ').pop().toLowerCase()
  const year  = String(match.year)
  const tournFull  = match.tournament_name.toLowerCase()
  const tournFirst = tournFull.split(' ')[0]

  const hasW     = hay.includes(wLast)
  const hasL     = hay.includes(lLast)
  const hasYear  = hay.includes(year)
  const hasTourn = hay.includes(tournFull) || (tournFirst.length > 4 && hay.includes(tournFirst))

  // ── Hard reject ────────────────────────────────────────────────────
  // 1. Entrambi i giocatori OBBLIGATORI (un solo nome → potrebbe essere
  //    qualsiasi altra partita di quel giocatore — vedi Safin/Johansson)
  if (!hasW || !hasL) return 0
  // 2. Contenuto non-partita (compilation, tribute, intervista)
  if (DEEP_REJECT.test(hay)) return 0
  // 3. Anno diverso esplicito nel titolo
  const yearInTitle = title.match(/\b(19|20)\d{2}\b/)
  if (yearInTitle && yearInTitle[0] !== year) return 0
  // 4. Torneo sbagliato: il titolo cita un altro Slam o un torneo non-Slam
  const ourSlam = SLAM_PATTERNS[match.tournament_slug]
  const titleHasOurSlam = ourSlam ? ourSlam.test(title) : false
  for (const [slug, rx] of Object.entries(SLAM_PATTERNS)) {
    if (slug !== match.tournament_slug && rx.test(title) && !titleHasOurSlam) return 0
  }
  if (OTHER_TOURNAMENTS.test(title) && !titleHasOurSlam) return 0
  // 5. Serve almeno UNA conferma forte: anno corretto OPPURE torneo corretto.
  //    Senza nessuna delle due, due nomi soli non bastano a identificare
  //    la partita (gli stessi giocatori si sono affrontati piu volte).
  if (!hasYear && !hasTourn && !titleHasOurSlam) return 0

  // ── Scoring (entrambi i giocatori garantiti) ───────────────────────
  let score = 6                                       // base: entrambi i giocatori
  if (hasYear)  score += 3
  if (hasTourn) score += 2
  if (titleHasOurSlam) score += 2                     // torneo confermato nel titolo
  if (title.includes(wLast) && title.includes(lLast)) score += 2  // entrambi nel TITOLO
  if (/full\s*match|match\s*complet|incontro\s*completo|full\s*video/i.test(hay)) score += 2
  if (/highlights|sintesi/i.test(hay)) score += 1
  if (TRUSTED_CHANNELS.has(item.snippet?.channelId)) score += 2
  // Round coerente
  if (match.round === 'F'  && /\bfinal\b|finale/i.test(hay)) score += 1
  if (match.round === 'SF' && /\bsemi/i.test(hay)) score += 1
  // Penalità round palesemente sbagliato
  if (match.round === 'F' && /quarterfinal|quarter-final|\bqf\b/i.test(title)) score -= 4
  if (match.round === 'F' && /semifinal|semi-final|\bsf\b/i.test(title)) score -= 3

  return score
}

async function findVideoDeep(match) {
  const wFull  = match.winner_name
  const lFull  = match.loser_name
  const wLast  = wFull.split(' ').pop()
  const lLast  = lFull.split(' ').pop()
  const tourn  = match.tournament_name
  const roundWord = match.round === 'F' ? 'final'
                  : match.round === 'SF' ? 'semifinal'
                  : 'quarterfinal'

  // 3 varianti di query per massimizzare il recall
  const queries = [
    `${wFull} ${lFull} ${tourn} ${match.year}`,
    `${wLast} vs ${lLast} ${match.year} tennis`,
    `${tourn} ${match.year} ${roundWord}`,
  ]

  let allItems = []
  for (const q of queries) {
    try {
      const items = await ytSearch(q)
      allItems = allItems.concat(items)
      await sleep(250)
    } catch (e) {
      if (e.message.includes('quota') || e.message.includes('403')) throw e
      // altri errori: continua con le query rimanenti
    }
  }
  if (allItems.length === 0) return null

  // Scoring + dedup per videoId
  const seen = new Set()
  const scored = allItems
    .filter(item => {
      const id = item.id?.videoId
      if (!id || seen.has(id)) return false
      seen.add(id)
      return true
    })
    .map(item => ({ item, score: scoreResultDeep(item, match) }))
    .sort((a, b) => b.score - a.score)

  const best = scored[0]
  // Soglia 8: entrambi giocatori + anno (9), o entrambi + torneo (8),
  // o un giocatore + anno + torneo + full-match (9). Esclude i match deboli.
  if (!best || best.score < 8) return null

  return {
    videoId: best.item.id.videoId,
    title: best.item.snippet?.title ?? '',
    channel: best.item.snippet?.channelTitle ?? '',
    score: best.score,
  }
}

// ── Spot pubblicitari giocatori ─────────────────────────────────────────

// Brand iconici di tennis 1980-2002. La presenza nel titolo è bonus forte.
const TENNIS_BRANDS = /\b(nike|canon|pepsi|coca[- ]?cola|volvo|diadora|fila|yonex|wilson|reebok|adidas|head|prince|babolat|nokia|tag\s*heuer|rolex|movado|kit\s*kat|gillette|american\s*express|amex|donnay|asics|ellesse|sergio\s*tacchini|lacoste|head&shoulders)\b/i

// Parole che indicano uno spot/commercial (non match, non interview)
const COMMERCIAL_KEYWORDS = /\b(commercial|spot|advert(isement)?|pubblicit[aà]|tv\s*ad|tv\s*spot|cm|reklam|werbung|publicit[eé])\b/i

// Parole da penalizzare/escludere (NON sono spot)
const NOT_COMMERCIAL = /\b(highlights|full\s*match|interview|press\s*conference|trophy|ceremony|on[- ]court|net\s*cam|atp\s*tour|grand\s*slam\s*highlights|documentary)\b/i

function scoreCommercial(item, player) {
  const title    = (item.snippet?.title ?? '').toLowerCase()
  const desc     = (item.snippet?.description ?? '').toLowerCase()
  const haystack = `${title} ${desc}`
  const lastName  = player.last_name.toLowerCase()
  const firstName = player.first_name.toLowerCase()

  // Requisito hard: il cognome deve essere nel titolo (case-insensitive)
  if (!title.includes(lastName)) return 0

  // Esclusione hard se è chiaramente un match/intervista/doc
  if (NOT_COMMERCIAL.test(haystack)) return 0

  let score = 0
  if (COMMERCIAL_KEYWORDS.test(haystack)) score += 6
  if (TENNIS_BRANDS.test(haystack)) score += 5
  if (title.includes(firstName)) score += 1

  // Bonus se il video è breve (tipico per spot: 30-90s)
  // Lo sappiamo solo dal titolo ("30 second", "60 sec", ecc.)
  if (/\b(30|60|90)\s*(s|sec|second)/i.test(haystack)) score += 2

  // Decade marker bonus (anni '80/'90)
  if (/\b(198[0-9]|199[0-9]|200[0-2])\b/.test(title)) score += 1

  // Penalità se il titolo contiene un altro nome di tennista famoso (potrebbe non riguardare il nostro)
  // Questa è euristica: se il titolo elenca 3+ cognomi noti, probabilmente è una compilation
  const otherNames = ['sampras','agassi','federer','nadal','djokovic','borg','mcenroe','lendl','becker','edberg','courier','chang','wilander','connors','rafter','hewitt','safin','ivanisevic']
    .filter(n => n !== lastName)
  const otherCount = otherNames.filter(n => title.includes(n)).length
  if (otherCount >= 2) score -= 3

  return score
}

async function findCommercial(player) {
  const fullName = `${player.first_name} ${player.last_name}`
  // Query mirata: nome + parola "commercial" + alcune brand chiave + decade
  const query = `${fullName} commercial OR spot OR pubblicità tennis`
  const items = await ytSearch(query)
  if (items.length === 0) return null

  const scored = items
    .map(item => ({ item, score: scoreCommercial(item, player) }))
    .filter(s => s.score >= 6)  // soglia: deve avere almeno keyword commercial OR brand match
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, 5).map(s => ({   // ritorna fino a 5 candidati (un giocatore può avere più spot)
    videoId: s.item.id.videoId,
    title:   s.item.snippet?.title ?? '',
    channel: s.item.snippet?.channelTitle ?? '',
    description: (s.item.snippet?.description ?? '').slice(0, 200),
    publishedAt: s.item.snippet?.publishedAt ?? null,
    score:   s.score,
  }))
}

// Estrae il brand dal titolo per il campo "author" del cultural_impact
function extractBrand(title) {
  const m = title.match(TENNIS_BRANDS)
  if (!m) return null
  const raw = m[0]
  return raw[0].toUpperCase() + raw.slice(1).toLowerCase()
}

// Decodifica HTML entities comuni che YouTube API restituisce nei titoli
function decodeHtmlEntities(s) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
}

// Estrae uno slogan/sottotitolo dal titolo
// Es. 'Canon Rebel "Change the image"' → 'Change the image'
function extractSlogan(title) {
  const t = decodeHtmlEntities(title)
  const m =
    t.match(/["“„«]([^"”»]{3,70})["”»]/) ||
    t.match(/'([^']{3,70})'/) ||
    t.match(/-\s+([A-Z][^-\d()]{3,60})(?:\s*\(|$)/)  // testo dopo trattino: "commercial - Street Tennis"
  if (!m) return null
  // Pulisci e scarta se è semplicemente un nome di brand già noto
  const slogan = m[1].replace(/\s+/g, ' ').trim()
  if (TENNIS_BRANDS.test(slogan)) return null
  if (/^(commercial|spot|ad|tv\s*ad|tennis|vintage)$/i.test(slogan)) return null
  return slogan
}

// Genera una descrizione narrativa dello spot a partire dai metadati YouTube.
// Preferisce la descrizione YouTube se utile, altrimenti costruisce dalla
// combinazione titolo + brand + anno + slogan.
function buildAdDescription({ title, description, brand, year, channel }) {
  const cleanDesc = (description ?? '').replace(/\s+/g, ' ').trim()

  // Boilerplate da scartare
  const boilerplate = /^(subscribe|follow|like|please|hit\s*the|watch\s*more|enjoy)/i

  // Se la descrizione è informativa, usala come base (prima frase)
  if (cleanDesc.length >= 40 && !boilerplate.test(cleanDesc)) {
    // Prendi prima frase o primi 240 caratteri
    const firstSentence = cleanDesc.match(/^[^.!?]{20,240}[.!?]/)?.[0] ?? cleanDesc.slice(0, 220)
    return firstSentence.trim()
  }

  // Costruisci dai metadati
  const slogan = extractSlogan(title)
  const parts = []

  if (brand && year)      parts.push(`Spot ${brand}, ${year}`)
  else if (brand)         parts.push(`Spot ${brand}`)
  else if (year)          parts.push(`Spot pubblicitario del ${year}`)
  else                    parts.push('Spot pubblicitario')

  if (slogan) parts.push(`campagna «${slogan}»`)

  // Director menzionato
  const directedBy = title.match(/directed\s+by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)?.[1]
  if (directedBy) parts.push(`regia di ${directedBy}`)

  return parts.join(' — ') + '.'
}

// Estrae l'anno dal titolo se presente (4 cifre 19xx o 20xx)
function extractYear(title, description) {
  const text = `${title} ${description}`
  const m = text.match(/\b(198\d|199\d|200[0-2])\b/)
  return m ? parseInt(m[0], 10) : null
}

// ── main ──────────────────────────────────────────────────────────────────

if (MODE === 'deep') {
  // ── Branca deep — ricerca aggressiva sulle partite non trovate ──────
  const matches = await db`
    SELECT
      m.id, m.slug, m.year, m.round,
      t.name  AS tournament_name,
      w.first_name || ' ' || w.last_name AS winner_name,
      l.first_name || ' ' || l.last_name AS loser_name
    FROM matches m
    JOIN tournaments t ON t.id = m.tournament_id
    JOIN players     w ON w.id = m.winner_id
    JOIN players     l ON l.id = m.loser_id
    WHERE m.round = ANY(${ROUNDS})
      AND m.youtube_video_id IS NULL
      AND m.youtube_searched_at IS NOT NULL
      ${ALL || RETRY ? db`` : db`AND m.youtube_deep_searched_at IS NULL`}
      ${YEAR_FROM ? db`AND m.year >= ${YEAR_FROM}` : db``}
      ${YEAR_TO   ? db`AND m.year <= ${YEAR_TO}`   : db``}
    ORDER BY m.year DESC
    LIMIT ${LIMIT}
  `

  console.log(`Partite da ri-cercare (deep): ${matches.length}`)
  if (DRY_RUN) console.log('[DRY RUN — nessuna scrittura]\n')

  let found = 0, not_found = 0, errors = 0, consecutiveErrors = 0

  for (const m of matches) {
    process.stdout.write(`  [${m.year}] ${m.round} ${m.winner_name} vs ${m.loser_name} (${m.tournament_name}) ... `)
    try {
      const result = await findVideoDeep(m)
      consecutiveErrors = 0
      // Scarta se il video è già assegnato a un'altra partita (cross-assignment)
      const isDuplicate = result && !DRY_RUN && await isVideoAlreadyUsed(result.videoId, m.id)
      if (result && !isDuplicate) {
        console.log(`✓ ${result.videoId} score=${result.score} [${result.channel}]`)
        console.log(`       "${result.title.slice(0, 64)}"`)
        found++
        if (!DRY_RUN) {
          await db`
            UPDATE matches
            SET youtube_video_id        = ${result.videoId},
                youtube_channel         = ${result.channel},
                youtube_verified_at     = NOW(),
                youtube_deep_searched_at = NOW()
            WHERE id = ${m.id}
          `
        }
      } else if (result && isDuplicate) {
        console.log(`✗ scartato (video già usato da altra partita): ${result.videoId}`)
        not_found++
        if (!DRY_RUN) {
          await db`UPDATE matches SET youtube_deep_searched_at = NOW() WHERE id = ${m.id}`
        }
      } else {
        console.log('✗ non trovato')
        not_found++
        if (!DRY_RUN) {
          await db`UPDATE matches SET youtube_deep_searched_at = NOW() WHERE id = ${m.id}`
        }
      }
      await sleep(400)
    } catch (e) {
      console.log(`⚠ ${e.message}`)
      errors++
      if (isQuotaExhausted(e)) {
        console.log('\n⚠ Quota YouTube esaurita. Riprova domani.')
        break
      }
      if (++consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        console.log(`\n⚠ ${MAX_CONSECUTIVE_ERRORS} errori consecutivi — interruzione (problema sistemico, non quota).`)
        break
      }
      // errore isolato: salta questa partita e prosegui
    }
  }

  console.log(`\n── Riepilogo (deep) ────────────────────`)
  console.log(`  Video recuperati : ${found}`)
  console.log(`  Ancora non trovati: ${not_found}`)
  console.log(`  Errori           : ${errors}`)
  console.log(`  Quota stimata    : ~${(found + not_found) * 3 * 100} unità / 10.000 giornaliere`)

  await db.end()
  process.exit(0)
}

if (MODE === 'commercials') {
  // ── Branca commercials ──────────────────────────────────────────────
  const players = await db`
    SELECT id, slug, first_name, last_name, grand_slams, atp_peak_rank, commercials_searched_at
    FROM players
    WHERE 1=1
      ${ALL
        ? db``
        : RETRY
          ? db``
          : db`AND commercials_searched_at IS NULL`}
      -- Solo top player: i meno noti non hanno spot
      AND (grand_slams >= 1 OR atp_peak_rank <= 30)
    ORDER BY grand_slams DESC NULLS LAST, atp_peak_rank ASC NULLS LAST
    LIMIT ${LIMIT}
  `

  console.log(`Giocatori da processare: ${players.length}`)
  if (DRY_RUN) console.log('[DRY RUN — nessuna scrittura]\n')

  let found_total = 0, players_with_ads = 0, players_no_ads = 0, errors = 0, consecutiveErrors = 0

  for (const p of players) {
    const label = `${p.first_name} ${p.last_name} (${p.grand_slams ?? 0} slam, #${p.atp_peak_rank ?? '-'})`
    console.log(label)

    try {
      const candidates = await findCommercial(p)
      consecutiveErrors = 0
      if (candidates && candidates.length > 0) {
        // Inserisci ciascuno spot come cultural_impact con type='ad'
        for (const c of candidates) {
          const brand = extractBrand(c.title)
          const year = extractYear(c.title, c.description)
          const url = `https://www.youtube.com/watch?v=${c.videoId}`

          // Skip se già presente nel DB (dedup per URL)
          if (!DRY_RUN) {
            const existing = await db`
              SELECT id FROM cultural_impacts
              WHERE url = ${url} AND ${p.id} = ANY(player_ids)
              LIMIT 1
            `
            if (existing.length > 0) {
              console.log(`    · già presente: ${c.title.slice(0, 60)}`)
              continue
            }

            const body = buildAdDescription({
              title: c.title,
              description: c.description,
              brand,
              year,
              channel: c.channel,
            })
            await db`
              INSERT INTO cultural_impacts (
                type, emoji, title, year, author, body, url,
                match_ids, player_ids, tournament_id, link_level
              ) VALUES (
                'ad', '📺',
                ${decodeHtmlEntities(c.title).slice(0, 200)},
                ${year},
                ${brand ?? c.channel.slice(0, 100)},
                ${body},
                ${url},
                ${[]}::int[], ${[p.id]}::int[], ${null},
                'direct'
              )
            `
          }
          console.log(`    ✓ ${brand ?? c.channel} (${year ?? '?'})  score=${c.score}`)
          console.log(`       "${decodeHtmlEntities(c.title).slice(0, 70)}"`)
          found_total++
        }
        players_with_ads++
      } else {
        console.log('    ✗ nessuno spot trovato')
        players_no_ads++
      }

      if (!DRY_RUN) {
        await db`UPDATE players SET commercials_searched_at = NOW() WHERE id = ${p.id}`
      }
      await sleep(400)
    } catch (e) {
      console.log(`    ⚠ ${e.message}`)
      errors++
      if (isQuotaExhausted(e)) {
        console.log('\n⚠ Quota YouTube esaurita. Riprova domani.')
        break
      }
      if (++consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        console.log(`\n⚠ ${MAX_CONSECUTIVE_ERRORS} errori consecutivi — interruzione (problema sistemico, non quota).`)
        break
      }
      // errore isolato: salta questo giocatore e prosegui
    }
  }

  console.log(`\n── Riepilogo (commercials) ────────────────`)
  console.log(`  Giocatori processati  : ${players.length}`)
  console.log(`  Con almeno uno spot   : ${players_with_ads}`)
  console.log(`  Senza spot trovati    : ${players_no_ads}`)
  console.log(`  Spot totali inseriti  : ${found_total}`)
  console.log(`  Errori                : ${errors}`)
  console.log(`  Quota stimata         : ~${players.length * 100} unità / 10.000 giornaliere`)

  await db.end()
  process.exit(0)
}

// ── Branca matches (default) ─────────────────────────────────────────

// Match candidates: comprende partite che hanno bisogno della ricerca main O della ricerca tommasi
const matches = await db`
  SELECT
    m.id, m.slug, m.year, m.round, m.youtube_video_id, m.youtube_searched_at,
    m.youtube_tommasi_id, m.youtube_tommasi_searched_at,
    t.slug  AS tournament_slug,
    t.name  AS tournament_name,
    w.first_name || ' ' || w.last_name AS winner_name,
    l.first_name || ' ' || l.last_name AS loser_name
  FROM matches m
  JOIN tournaments t ON t.id = m.tournament_id
  JOIN players     w ON w.id = m.winner_id
  JOIN players     l ON l.id = m.loser_id
  WHERE m.round = ANY(${ROUNDS})
    ${ALL
      ? db``
      : RETRY
        ? db`AND (m.youtube_video_id IS NULL OR (m.youtube_video_id IS NOT NULL AND m.youtube_tommasi_id IS NULL))`
        : db`AND (
              (m.youtube_video_id IS NULL AND m.youtube_searched_at IS NULL)
              OR
              (m.youtube_video_id IS NOT NULL AND m.youtube_tommasi_searched_at IS NULL)
            )`}
    ${YEAR_FROM ? db`AND m.year >= ${YEAR_FROM}`   : db``}
    ${YEAR_TO   ? db`AND m.year <= ${YEAR_TO}`     : db``}
  ORDER BY
    -- Prima quelli che hanno già video (Tommasi è un'aggiunta veloce)
    (m.youtube_video_id IS NOT NULL) DESC,
    m.year DESC
  LIMIT ${LIMIT}
`

console.log(`Partite da processare: ${matches.length} (turni: ${ROUNDS.join(',')})`)
if (SKIP_TOMMASI) console.log('[Tommasi/Clerici disabilitato con --skip-tommasi]')
if (DRY_RUN) console.log('[DRY RUN]\n')

let main_found = 0, main_not_found = 0
let it_found = 0, it_not_found = 0, it_skipped = 0
let errors = 0, consecutiveErrors = 0

for (const m of matches) {
  const label = `[${m.year}] ${m.round} ${m.winner_name} vs ${m.loser_name} (${m.tournament_name})`
  console.log(`  ${label}`)

  // ── Fase 1: ricerca main video (se necessaria) ──
  let mainVideoFound = !!m.youtube_video_id
  const needMainSearch = !m.youtube_video_id && !m.youtube_searched_at
  if (needMainSearch || (ALL && !m.youtube_video_id)) {
    try {
      const result = await findVideo(m)
      consecutiveErrors = 0
      const isDuplicate = result && !DRY_RUN && await isVideoAlreadyUsed(result.videoId, m.id)
      if (result && !isDuplicate) {
        console.log(`    ✓ MAIN ${result.videoId} [${result.channel}]`)
        console.log(`       "${result.title.slice(0,60)}"`)
        main_found++
        mainVideoFound = true
        if (!DRY_RUN) {
          await db`
            UPDATE matches
            SET youtube_video_id    = ${result.videoId},
                youtube_channel     = ${result.channel},
                youtube_verified_at = NOW(),
                youtube_searched_at = NOW()
            WHERE id = ${m.id}
          `
        }
      } else if (result && isDuplicate) {
        console.log(`    ✗ MAIN scartato (video già usato): ${result.videoId}`)
        main_not_found++
        if (!DRY_RUN) {
          await db`UPDATE matches SET youtube_searched_at = NOW() WHERE id = ${m.id}`
        }
      } else {
        console.log('    ✗ MAIN non trovato')
        main_not_found++
        if (!DRY_RUN) {
          await db`UPDATE matches SET youtube_searched_at = NOW() WHERE id = ${m.id}`
        }
      }
      await sleep(400)
    } catch(e) {
      console.log(`    ⚠ MAIN errore: ${e.message}`)
      errors++
      if (isQuotaExhausted(e)) {
        console.log('\n⚠ Quota YouTube esaurita. Riprova domani.')
        break
      }
      if (++consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        console.log(`\n⚠ ${MAX_CONSECUTIVE_ERRORS} errori consecutivi — interruzione (problema sistemico, non quota).`)
        break
      }
      continue   // errore isolato: salta questa partita (anche il Tommasi) e prosegui
    }
  }

  // ── Fase 2: ricerca telecronaca italiana (solo se main trovato) ──
  const needTommasi = !SKIP_TOMMASI && mainVideoFound && !m.youtube_tommasi_id && !m.youtube_tommasi_searched_at
  if (needTommasi) {
    try {
      const result = await findItalianVideo(m)
      consecutiveErrors = 0
      if (result) {
        console.log(`    ✓ TOMMASI ${result.videoId} [${result.channel}]`)
        console.log(`       "${result.title.slice(0,60)}"`)
        it_found++
        if (!DRY_RUN) {
          await db`
            UPDATE matches
            SET youtube_tommasi_id          = ${result.videoId},
                youtube_tommasi_channel     = ${result.channel},
                youtube_tommasi_searched_at = NOW()
            WHERE id = ${m.id}
          `
        }
      } else {
        console.log('    · TOMMASI non trovato')
        it_not_found++
        if (!DRY_RUN) {
          await db`UPDATE matches SET youtube_tommasi_searched_at = NOW() WHERE id = ${m.id}`
        }
      }
      await sleep(400)
    } catch(e) {
      console.log(`    ⚠ TOMMASI errore: ${e.message}`)
      errors++
      if (isQuotaExhausted(e)) {
        console.log('\n⚠ Quota YouTube esaurita. Riprova domani.')
        break
      }
      if (++consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        console.log(`\n⚠ ${MAX_CONSECUTIVE_ERRORS} errori consecutivi — interruzione (problema sistemico, non quota).`)
        break
      }
      // errore isolato sul Tommasi: prosegui col prossimo match
    }
  } else if (!SKIP_TOMMASI && !mainVideoFound) {
    it_skipped++
  }
}

const quotaUsed = (main_found + main_not_found) * 200 + (it_found + it_not_found) * 100
console.log(`\n── Riepilogo ────────────────────────`)
console.log(`  Main video trovati    : ${main_found}`)
console.log(`  Main non trovati      : ${main_not_found}`)
if (!SKIP_TOMMASI) {
  console.log(`  Tommasi trovati       : ${it_found}`)
  console.log(`  Tommasi non trovati   : ${it_not_found}`)
  if (it_skipped > 0) console.log(`  Tommasi saltati       : ${it_skipped} (main assente)`)
}
console.log(`  Errori                : ${errors}`)
console.log(`  Quota stimata         : ~${quotaUsed} unità / 10.000 giornaliere`)

await db.end()
