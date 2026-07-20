/**
 * migrate.mjs — Runner di migrazioni idempotente con tracking.
 *
 * Esegue tutti gli script `database/migrate_*.mjs` in ordine alfabetico,
 * saltando quelli già applicati. Le migrazioni applicate sono tracciate
 * nella tabella `schema_migrations`.
 *
 * Caratteristiche:
 *   - Idempotente: rilanciabile senza effetti collaterali
 *   - Ordine alfabetico (usa prefissi numerici per controllare l'ordine)
 *   - Esce con codice ≠ 0 se una migrazione fallisce
 *
 * Uso:
 *   node database/migrate.mjs                 → esegui tutte le pending
 *   node database/migrate.mjs --list          → mostra solo lo stato
 *   node database/migrate.mjs --redo <name>   → ri-esegui una migrazione specifica
 */

import postgres from 'postgres'
import { readdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const LIST_ONLY = process.argv.includes('--list')
const REDO = (() => { const i = process.argv.indexOf('--redo'); return i >= 0 ? process.argv[i + 1] : null })()

if (!process.env.DATABASE_URL) {
  console.error('❌  DATABASE_URL non configurata')
  process.exit(1)
}

const db = postgres(process.env.DATABASE_URL, { max: 1 })

// 1. Crea la tabella di tracking se non esiste
await db`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    name        VARCHAR(255) PRIMARY KEY,
    applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`

// 2. Trova tutti i file migrate_*.mjs (escludendo questo file)
const files = (await readdir(__dirname))
  .filter(f => f.startsWith('migrate_') && f.endsWith('.mjs'))
  .sort()

// 3. Stato delle migrazioni applicate
const appliedRows = await db`SELECT name FROM schema_migrations`
const applied = new Set(appliedRows.map(r => r.name))

console.log(`Migrazioni trovate: ${files.length}\n`)
for (const f of files) {
  const status = applied.has(f) ? '✓ applicata' : '○ pending '
  console.log(`  ${status}  ${f}`)
}
console.log()

if (LIST_ONLY) {
  await db.end()
  process.exit(0)
}

// 4. Determina cosa eseguire
let toRun = []
if (REDO) {
  if (!files.includes(REDO)) {
    console.error(`❌  Migrazione "${REDO}" non trovata`)
    await db.end()
    process.exit(1)
  }
  toRun = [REDO]
  await db`DELETE FROM schema_migrations WHERE name = ${REDO}`
} else {
  toRun = files.filter(f => !applied.has(f))
}

if (toRun.length === 0) {
  console.log('Niente da fare — tutte le migrazioni sono già applicate.')
  await db.end()
  process.exit(0)
}

console.log(`Eseguo ${toRun.length} migrazion${toRun.length === 1 ? 'e' : 'i'}:\n`)

await db.end()  // chiudo qui — gli script importati aprono la propria connessione

let failed = false
for (const file of toRun) {
  console.log(`── ${file} ──`)
  try {
    await import(pathToFileURL(join(__dirname, file)).href)

    const trackDb = postgres(process.env.DATABASE_URL, { max: 1 })
    await trackDb`INSERT INTO schema_migrations (name) VALUES (${file}) ON CONFLICT DO NOTHING`
    await trackDb.end()
    console.log(`✓ ${file} completata\n`)
  } catch (e) {
    console.error(`❌ ${file} fallita:`)
    console.error(e)
    failed = true
    break
  }
}

if (failed) process.exit(1)
console.log('Tutte le migrazioni applicate con successo.')
