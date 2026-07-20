/**
 * download_player_photos.mjs
 *
 * Scarica tutte le foto da Wikimedia in public/players/{slug}.jpg
 * e aggiorna players.photo_url con il path locale.
 *
 * Risolve il problema di rate-limiting di Wikimedia (hot-linking).
 *
 * Uso:
 *   node database/download_player_photos.mjs              → scarica tutto
 *   node database/download_player_photos.mjs --dry-run    → simula
 *   node database/download_player_photos.mjs --redo       → riscarica anche quelli locali
 */

import postgres from 'postgres'
import { writeFile, mkdir, access } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = join(__dirname, '..', 'public', 'players')

const DRY_RUN = process.argv.includes('--dry-run')
const REDO    = process.argv.includes('--redo')
const DELAY   = 2500  // 2.5s tra ogni download per evitare rate limit

const db = postgres(process.env.DATABASE_URL, { max: 1 })
// Wikimedia rifiuta UA tipo "Mozilla + bot string" perché lo classifica come bot mascherato.
// Usa solo l'identificativo descrittivo come da policy Wikimedia.
const UA = 'AceChronicle/1.0 (https://acechronicle.it; testamario75@gmail.com)'

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function fileExists(path) {
  try { await access(path); return true } catch { return false }
}

await mkdir(PUBLIC_DIR, { recursive: true })

const players = await db`
  SELECT id, slug, first_name, last_name, photo_url, photo_credit
  FROM players
  WHERE photo_url IS NOT NULL
    ${REDO ? db`` : db`AND photo_url LIKE 'https://%'`}
  ORDER BY grand_slams DESC NULLS LAST, atp_peak_rank ASC NULLS LAST
`

console.log(`Foto da scaricare: ${players.length}`)
if (DRY_RUN) console.log('[DRY RUN]\n')

let saved = 0, skipped = 0, errors = 0

for (const p of players) {
  const ext = p.photo_url.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1].toLowerCase() ?? 'jpg'
  const filename = `${p.slug}.${ext === 'jpeg' ? 'jpg' : ext}`
  const localPath = join(PUBLIC_DIR, filename)
  const publicUrl = `/players/${filename}`

  process.stdout.write(`  ${p.first_name} ${p.last_name} → ${filename} ... `)

  // Salta se già scaricata
  if (!REDO && await fileExists(localPath)) {
    console.log('già presente')
    if (!DRY_RUN && p.photo_url !== publicUrl) {
      await db`UPDATE players SET photo_url = ${publicUrl} WHERE id = ${p.id}`
    }
    skipped++
    continue
  }

  try {
    const res = await fetch(p.photo_url, {
      headers: { 'User-Agent': UA, 'Referer': 'https://en.wikipedia.org/' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) {
      console.log(`✗ HTTP ${res.status}`)
      errors++
      if (res.status === 429) {
        console.log('\n⚠ Rate limit raggiunto. Attendo 60s...')
        await sleep(60000)
      }
      continue
    }
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 500) {
      console.log(`✗ file troppo piccolo (${buf.length}b)`)
      errors++
      continue
    }
    if (!DRY_RUN) {
      await writeFile(localPath, buf)
      await db`UPDATE players SET photo_url = ${publicUrl} WHERE id = ${p.id}`
    }
    console.log(`✓ ${(buf.length / 1024).toFixed(0)}KB`)
    saved++
  } catch (e) {
    console.log(`✗ ${e.message}`)
    errors++
  }

  await sleep(DELAY)
}

console.log(`\n── Riepilogo ────────────────────────`)
console.log(`  Scaricate     : ${saved}`)
console.log(`  Già presenti  : ${skipped}`)
console.log(`  Errori        : ${errors}`)

await db.end()
