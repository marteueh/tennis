/**
 * Importa tutti i Grandi Slam ATP dal dataset Jeff Sackmann (GitHub)
 * Uso: node database/import_sackmann.mjs
 * Dopo: node database/migrate_cultural_impact.mjs
 */
import postgres from 'postgres'

const db = postgres(process.env.DATABASE_URL, { max: 1 })
const BASE = 'https://raw.githubusercontent.com/JeffSackmann/tennis_atp/master'
const YEAR_FROM = 1980
const YEAR_TO   = 2002

// ── CSV helpers ───────────────────────────────────────────────────────────────

function splitLine(line) {
  const out = []; let cur = ''; let inQ = false
  for (const c of line) {
    if (c === '"') inQ = !inQ
    else if (c === ',' && !inQ) { out.push(cur); cur = '' }
    else cur += c
  }
  out.push(cur)
  return out
}

function parseCSV(text) {
  const lines = text.trim().split('\n').map(l => l.replace(/\r$/, ''))
  const headers = splitLine(lines[0]).map(h => h.trim())
  return lines.slice(1).filter(Boolean).map(line => {
    const vals = splitLine(line)
    return Object.fromEntries(headers.map((h, i) => [h, (vals[i] ?? '').trim()]))
  })
}

function toSlug(str) {
  return (str || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function num(v) { const n = parseInt(v); return isNaN(n) ? null : n }

function toDate(yyyymmdd) {
  if (!yyyymmdd || yyyymmdd.length < 8) return null
  const s = yyyymmdd.replace(/\D/g, '')
  return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`
}

const SLAM_SLUGS = {
  'australian open': 'australian-open',
  'roland garros':   'roland-garros',
  'wimbledon':       'wimbledon',
  'us open':         'us-open',
}

function slamSlug(name) {
  const n = (name || '').toLowerCase()
  for (const [k, v] of Object.entries(SLAM_SLUGS)) if (n.includes(k)) return v
  return null
}

// ── 1. Scarica e filtra partite per anno ──────────────────────────────────────

console.log(`⏳  Download Grandi Slam ${YEAR_FROM}–${YEAR_TO}…\n`)

const allRows   = []
const neededIds = new Set()

for (let yr = YEAR_FROM; yr <= YEAR_TO; yr++) {
  const url = `${BASE}/atp_matches_${yr}.csv`
  try {
    const res = await fetch(url)
    if (!res.ok) { console.warn(`  ⚠  ${yr}: HTTP ${res.status}`); continue }
    const rows = parseCSV(await res.text()).filter(r =>
      r.tourney_level === 'G' && r.score?.trim() && r.winner_id && r.loser_id
    )
    rows.forEach(r => { neededIds.add(r.winner_id); neededIds.add(r.loser_id) })
    allRows.push(...rows)
    console.log(`  ✓  ${yr}  ${String(rows.length).padStart(4)} partite Slam`)
  } catch (e) { console.warn(`  ⚠  ${yr}: ${e.message}`) }
}

console.log(`\n  Totale: ${allRows.length} partite · ${neededIds.size} giocatori unici\n`)

// ── 2. Scarica giocatori ──────────────────────────────────────────────────────

console.log('⏳  Download atp_players.csv…')
const pRes  = await fetch(`${BASE}/atp_players.csv`)
const pRows = parseCSV(await pRes.text()).filter(p => neededIds.has(p.player_id))
console.log(`  ✓  ${pRows.length} giocatori da importare\n`)

// ── 3. Pulizia matches ────────────────────────────────────────────────────────

console.log('🗑   Pulizia partite…')
await db`TRUNCATE matches RESTART IDENTITY CASCADE`
console.log('  ✓  Partite svuotate\n')

// ── 4. Inserisci giocatori ────────────────────────────────────────────────────

console.log('⏳  Inserimento giocatori…')

// Sackmann CSV usa "first_name"/"last_name" o "name_first"/"name_last" a seconda della versione
const getFirst = p => (p.first_name || p.name_first || '').trim()
const getLast  = p => (p.last_name  || p.name_last  || '').trim()

let pInserted = 0
for (const p of pRows) {
  const first = getFirst(p)
  const last  = getLast(p)
  if (!first || !last) continue
  const slug = `${toSlug(first)}-${toSlug(last)}`
  if (!slug || slug === '-') continue

  try {
    await db`
      INSERT INTO players (sackmann_id, slug, first_name, last_name, country_code, hand, birth_date, height_cm, grand_slams)
      VALUES (
        ${num(p.player_id)}, ${slug}, ${first}, ${last},
        ${p.country || p.ioc || null},
        ${p.hand === 'R' || p.hand === 'L' ? p.hand : null},
        ${toDate(p.dob)}, ${num(p.height)}, 0
      )
      ON CONFLICT (slug) DO UPDATE SET
        sackmann_id  = COALESCE(players.sackmann_id, EXCLUDED.sackmann_id),
        country_code = COALESCE(players.country_code, EXCLUDED.country_code),
        hand         = COALESCE(players.hand,         EXCLUDED.hand),
        birth_date   = COALESCE(players.birth_date,   EXCLUDED.birth_date),
        height_cm    = COALESCE(players.height_cm,    EXCLUDED.height_cm)
    `
    pInserted++
  } catch {
    // Slug collision con sackmann_id diverso → aggiunge suffisso numerico
    try {
      await db`
        INSERT INTO players (sackmann_id, slug, first_name, last_name, country_code, hand, birth_date, height_cm, grand_slams)
        VALUES (${num(p.player_id)}, ${slug + '-' + p.player_id}, ${first}, ${last},
                ${p.country || null}, ${p.hand === 'R' || p.hand === 'L' ? p.hand : null},
                ${toDate(p.dob)}, ${num(p.height)}, 0)
        ON CONFLICT (sackmann_id) DO NOTHING
      `
      pInserted++
    } catch { /* skip */ }
  }
}

console.log(`  ✓  ${pInserted} giocatori inseriti/aggiornati\n`)

// ── 5. Mappe ID ───────────────────────────────────────────────────────────────

const dbPlayers = await db`SELECT id, sackmann_id, slug FROM players WHERE sackmann_id IS NOT NULL`
const pidMap    = new Map(dbPlayers.map(r => [String(r.sackmann_id), r])) // sackmannId → {id, slug}

const dbTourns  = await db`SELECT id, slug FROM tournaments`
const tournMap  = new Map(dbTourns.map(r => [r.slug, r.id]))

// ── 6. Inserisci partite ──────────────────────────────────────────────────────

console.log('⏳  Inserimento partite…')
let mInserted = 0, mSkipped = 0

for (const r of allRows) {
  const tSlug = slamSlug(r.tourney_name)
  const tId   = tSlug ? tournMap.get(tSlug) : null
  const winner = pidMap.get(r.winner_id)
  const loser  = pidMap.get(r.loser_id)
  const round  = r.round?.trim()
  const year   = num(r.tourney_date?.slice(0, 4))

  if (!tId || !winner || !loser || !round || !year) { mSkipped++; continue }

  const slug = `${winner.slug}-vs-${loser.slug}-${tSlug}-${year}-${round.toLowerCase()}`

  try {
    await db`
      INSERT INTO matches (
        sackmann_id, slug, tournament_id, year, match_date, round, surface,
        winner_id, loser_id, winner_rank, loser_rank, score, duration_min,
        w_ace, w_df, w_svpt, w_1stIn, w_1stWon, w_2ndWon, w_SvGms, w_bpSaved, w_bpFaced,
        l_ace, l_df, l_svpt, l_1stIn, l_1stWon, l_2ndWon, l_SvGms, l_bpSaved, l_bpFaced,
        featured
      ) VALUES (
        ${r.tourney_id + '-' + r.match_num}, ${slug}, ${tId}, ${year},
        ${toDate(r.tourney_date)}, ${round}, ${r.surface || null},
        ${winner.id}, ${loser.id}, ${num(r.winner_rank)}, ${num(r.loser_rank)},
        ${r.score}, ${num(r.minutes)},
        ${num(r.w_ace)},  ${num(r.w_df)},    ${num(r.w_svpt)}, ${num(r.w_1stIn)},
        ${num(r.w_1stWon)}, ${num(r.w_2ndWon)}, ${num(r.w_SvGms)}, ${num(r.w_bpSaved)}, ${num(r.w_bpFaced)},
        ${num(r.l_ace)},  ${num(r.l_df)},    ${num(r.l_svpt)}, ${num(r.l_1stIn)},
        ${num(r.l_1stWon)}, ${num(r.l_2ndWon)}, ${num(r.l_SvGms)}, ${num(r.l_bpSaved)}, ${num(r.l_bpFaced)},
        false
      )
      ON CONFLICT (slug) DO NOTHING
    `
    mInserted++
  } catch { mSkipped++ }
}

console.log(`  ✓  ${mInserted} partite inserite · ${mSkipped} saltate\n`)

// ── 7. Calcola grand_slams e atp_peak_rank ────────────────────────────────────

console.log('⏳  Calcolo grand_slams e peak rank…')

await db`
  UPDATE players p SET grand_slams = (
    SELECT COUNT(*) FROM matches m
    JOIN tournaments t ON t.id = m.tournament_id
    WHERE m.winner_id = p.id AND m.round = 'F' AND t.category = 'GrandSlam'
  )
`

await db`
  UPDATE players p
  SET atp_peak_rank = sub.peak
  FROM (
    SELECT player_id, MIN(rank) AS peak FROM (
      SELECT winner_id AS player_id, winner_rank AS rank FROM matches WHERE winner_rank IS NOT NULL AND winner_rank > 0
      UNION ALL
      SELECT loser_id  AS player_id, loser_rank  AS rank FROM matches WHERE loser_rank  IS NOT NULL AND loser_rank  > 0
    ) r
    GROUP BY player_id
  ) sub
  WHERE sub.player_id = p.id
`

// ── Report finale ─────────────────────────────────────────────────────────────

const [{ n: totP }] = await db`SELECT COUNT(*) AS n FROM players`
const [{ n: totM }] = await db`SELECT COUNT(*) AS n FROM matches`
const [{ n: totY }] = await db`SELECT COUNT(DISTINCT year) AS n FROM matches`

console.log(`  ✓  grand_slams e peak_rank aggiornati\n`)
console.log(`✅  Import completato`)
console.log(`    ${totP} giocatori · ${totM} partite · ${totY} stagioni`)
console.log(`\n→  Esegui ora: node database/migrate_cultural_impact.mjs`)

await db.end()
