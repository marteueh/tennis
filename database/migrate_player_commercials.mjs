/**
 * migrate_player_commercials.mjs
 *
 * Aggiunge il tracking degli spot pubblicitari trovati per ciascun giocatore.
 * Gli spot vengono salvati come righe in `cultural_impacts` con type='ad',
 * collegati al giocatore tramite player_ids.
 */

import postgres from 'postgres'

const db = postgres(process.env.DATABASE_URL, { max: 1 })

await db`ALTER TABLE players ADD COLUMN IF NOT EXISTS commercials_searched_at TIMESTAMPTZ`

console.log('Colonna players.commercials_searched_at aggiunta')

await db.end()
