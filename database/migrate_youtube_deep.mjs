/**
 * migrate_youtube_deep.mjs
 *
 * Aggiunge il tracking della ricerca "deep" — il secondo passaggio piu
 * aggressivo che ricerca i video anche su canali non ufficiali con
 * titoli generici (es. "Wimbledon 1985 Final").
 */

import postgres from 'postgres'

const db = postgres(process.env.DATABASE_URL, { max: 1 })

await db`ALTER TABLE matches ADD COLUMN IF NOT EXISTS youtube_deep_searched_at TIMESTAMPTZ`

console.log('Colonna matches.youtube_deep_searched_at aggiunta')

await db.end()
