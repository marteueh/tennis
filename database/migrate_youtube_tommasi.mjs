/**
 * migrate_youtube_tommasi.mjs
 *
 * Aggiunge i campi per la versione con telecronaca italiana
 * (Tommasi/Clerici) alle partite.
 */

import postgres from 'postgres'

const db = postgres(process.env.DATABASE_URL, { max: 1 })

await db`ALTER TABLE matches ADD COLUMN IF NOT EXISTS youtube_tommasi_id VARCHAR(20)`
await db`ALTER TABLE matches ADD COLUMN IF NOT EXISTS youtube_tommasi_channel VARCHAR(255)`
await db`ALTER TABLE matches ADD COLUMN IF NOT EXISTS youtube_tommasi_searched_at TIMESTAMPTZ`

console.log('Colonne aggiunte: youtube_tommasi_id, youtube_tommasi_channel, youtube_tommasi_searched_at')

await db.end()
