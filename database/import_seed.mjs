import postgres from 'postgres'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const url   = process.env.DATABASE_URL

if (!url) {
  console.error('DATABASE_URL mancante')
  process.exit(1)
}

const db = postgres(url, { max: 1 })

try {
  console.log('Pulizia tabelle...')
  await db`TRUNCATE matches, players, tournaments, rankings RESTART IDENTITY CASCADE`

  // sackmann_id nei match è sequenziale per anno, non globalmente unico — slug è la chiave giusta
  await db`ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_sackmann_id_key`

  const raw = readFileSync(join(__dir, 'seed.sql'), 'utf8')
  console.log('Importazione dati...')
  await db.unsafe(raw)

  const [{ n }] = await db`SELECT COUNT(*) as n FROM players`
  const [{ m }] = await db`SELECT COUNT(*) as m FROM matches`
  console.log(`Completato: ${n} giocatori, ${m} partite`)
} catch (err) {
  console.error('Errore:', err.message)
} finally {
  await db.end()
}
