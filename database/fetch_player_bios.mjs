/**
 * fetch_player_bios.mjs
 *
 * Cerca biografie su Wikipedia (IT prima, EN come fallback) e salva
 * un estratto introduttivo in players.bio_it / bio_en.
 *
 * Comportamento incrementale:
 *  - Default: cerca solo i giocatori MAI controllati (bio_searched_at IS NULL)
 *  - --retry : ricontrolla anche quelli senza bio
 *  - --all   : ricontrolla TUTTI
 *  - Ogni tentativo (riuscito o no) imposta bio_searched_at = NOW()
 *
 * Licenza: CC-BY-SA — attribuzione salvata in bio_source.
 *
 * Uso:
 *   node database/fetch_player_bios.mjs              → solo giocatori mai cercati
 *   node database/fetch_player_bios.mjs --limit 100  → limita il numero
 *   node database/fetch_player_bios.mjs --dry-run    → simula
 *   node database/fetch_player_bios.mjs --retry      → riprova quelli senza bio
 */

import postgres from 'postgres'

const DRY_RUN = process.argv.includes('--dry-run')
const ALL     = process.argv.includes('--all')
const RETRY   = process.argv.includes('--retry')
const LIMIT   = (() => { const i = process.argv.indexOf('--limit'); return i >= 0 ? parseInt(process.argv[i+1]) : 500 })()

const db = postgres(process.env.DATABASE_URL, { max: 1 })
const UA = 'AceChronicle/1.0 (https://acechronicle.it; testamario75@gmail.com)'

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function fetchExtract(lang, title) {
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=extracts&exintro=1&explaintext=1&format=json&origin=*&redirects=1`
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000) })
  const data = await res.json()
  const page = Object.values(data?.query?.pages ?? {})[0]
  if (!page || page.missing || !page.extract) return null
  // Pulizia: rimuovi whitespace eccessivo
  const clean = page.extract.trim().replace(/\n{3,}/g, '\n\n')
  if (clean.length < 80) return null
  return { extract: clean, title: page.title }
}

async function searchTitle(lang, name) {
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name + ' tennis')}&srlimit=3&format=json&origin=*`
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000) })
  const data = await res.json()
  return data?.query?.search?.[0]?.title ?? null
}

async function fetchBio(firstName, lastName) {
  const name = `${firstName} ${lastName}`
  const result = { bio_it: null, bio_en: null, source: null, source_title: null }

  // 1. Prova italiano (titolo diretto)
  try {
    let it = await fetchExtract('it', name)
    // Fallback: ricerca per cognome (es. nomi accentati)
    if (!it) {
      const found = await searchTitle('it', name)
      if (found && found.toLowerCase().includes(lastName.toLowerCase().slice(0, 4))) {
        it = await fetchExtract('it', found)
      }
    }
    if (it) {
      result.bio_it = it.extract
      result.source = 'it.wikipedia.org'
      result.source_title = it.title
    }
  } catch { /* fallback */ }

  // 2. Inglese (titolo diretto + search fallback)
  await sleep(150)
  try {
    let en = await fetchExtract('en', name)
    if (!en) {
      const found = await searchTitle('en', name)
      if (found && found.toLowerCase().includes(lastName.toLowerCase().slice(0, 4))) {
        en = await fetchExtract('en', found)
      }
    }
    if (en) {
      result.bio_en = en.extract
      if (!result.source) {
        result.source = 'en.wikipedia.org'
        result.source_title = en.title
      }
    }
  } catch { /* ok */ }

  if (!result.bio_it && !result.bio_en) return null

  // Verifica anti-falso-positivo: il cognome (senza accenti) DEVE comparire nel bio (senza accenti)
  const stripAccents = (s) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
  const text = stripAccents(result.bio_it ?? result.bio_en ?? '')
  if (!text.includes(stripAccents(lastName))) return null

  return result
}

// ── main ─────────────────────────────────────────────────────────────────

const players = await db`
  SELECT id, first_name, last_name, slug, bio_it
  FROM players
  ${ALL
    ? db``
    : RETRY
      ? db`WHERE bio_it IS NULL`
      : db`WHERE bio_it IS NULL AND bio_searched_at IS NULL`}
  ORDER BY grand_slams DESC NULLS LAST, atp_peak_rank ASC NULLS LAST
  LIMIT ${LIMIT}
`

console.log(`Giocatori da processare: ${players.length}`)
if (DRY_RUN) console.log('[DRY RUN]\n')

let found = 0, not_found = 0, errors = 0

for (const p of players) {
  const name = `${p.first_name} ${p.last_name}`
  process.stdout.write(`  ${name} ... `)

  try {
    const result = await fetchBio(p.first_name, p.last_name)
    if (result) {
      const len = (result.bio_it ?? result.bio_en).length
      const lang = result.bio_it ? 'IT' : 'EN'
      console.log(`✓ ${lang} ${len}c — ${result.source}`)
      found++
      if (!DRY_RUN) {
        await db`
          UPDATE players SET
            bio_it          = ${result.bio_it},
            bio_en          = ${result.bio_en},
            bio_source      = ${result.source},
            bio_searched_at = NOW()
          WHERE id = ${p.id}
        `
      }
    } else {
      console.log('✗')
      not_found++
      if (!DRY_RUN) {
        await db`UPDATE players SET bio_searched_at = NOW() WHERE id = ${p.id}`
      }
    }
    await sleep(200)
  } catch (e) {
    console.log(`⚠ ${e.message}`)
    errors++
  }
}

console.log(`\n── Riepilogo ────────────────────────`)
console.log(`  Bio trovate   : ${found}`)
console.log(`  Non trovate   : ${not_found}`)
console.log(`  Errori        : ${errors}`)

await db.end()
