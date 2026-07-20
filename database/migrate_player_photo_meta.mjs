/**
 * migrate_player_photo_meta.mjs
 *
 * Colonne per il tracking foto/bio giocatori (usate da fetch_player_photos.mjs
 * e fetch_player_bios.mjs) che erano state aggiunte ad-hoc in locale senza
 * una migrazione tracciata.
 */

import postgres from 'postgres'

const db = postgres(process.env.DATABASE_URL, { max: 1 })

await db`ALTER TABLE players ADD COLUMN IF NOT EXISTS photo_url TEXT`
await db`ALTER TABLE players ADD COLUMN IF NOT EXISTS photo_credit TEXT`
await db`ALTER TABLE players ADD COLUMN IF NOT EXISTS photo_checked_at TIMESTAMPTZ`
await db`ALTER TABLE players ADD COLUMN IF NOT EXISTS bio_source TEXT`
await db`ALTER TABLE players ADD COLUMN IF NOT EXISTS bio_searched_at TIMESTAMPTZ`
await db`ALTER TABLE matches ADD COLUMN IF NOT EXISTS youtube_searched_at TIMESTAMPTZ`

console.log('Colonne photo/bio meta aggiunte')

await db.end()
