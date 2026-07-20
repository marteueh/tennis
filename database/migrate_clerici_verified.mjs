/**
 * migrate_clerici_verified.mjs
 *
 * Aggiunge i campi per la verifica degli articoli di Clerici su Repubblica.
 *  - clerici_article_title : titolo articolo verificato
 *  - clerici_verified_at   : timestamp ultima verifica
 *
 * Il campo clerici_source userà i nuovi valori:
 *  - 'repubblica_verified' → articolo trovato e link diretto disponibile
 *  - 'repubblica_not_found' → ricerca senza risultati validi
 */

import postgres from 'postgres'

const db = postgres(process.env.DATABASE_URL, { max: 1 })

await db`ALTER TABLE matches ADD COLUMN IF NOT EXISTS clerici_article_title TEXT`
await db`ALTER TABLE matches ADD COLUMN IF NOT EXISTS clerici_verified_at TIMESTAMPTZ`

console.log('Colonne aggiunte: clerici_article_title, clerici_verified_at')

await db.end()
