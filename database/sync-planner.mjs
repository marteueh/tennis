/**
 * sync-planner.mjs
 *
 * Calcola la ripartizione ottimale della quota YouTube giornaliera tra le
 * tre fasi della sync (matches, deep, commercials), in base alle code
 * ancora da processare.
 *
 * Logica:
 *  - Budget giornaliero: ~9300 unità (margine di sicurezza su 10.000)
 *  - matches e commercials hanno un TARGET fisso (20/giorno ciascuno)
 *  - deep assorbe TUTTO il budget residuo → quando le code matches o
 *    commercials si svuotano, la quota liberata va automaticamente a deep,
 *    che accelera senza intervento manuale
 *
 * Output (parsato da sync-youtube.ps1):
 *  SYNC_MATCHES_LIMIT=<n>
 *  SYNC_DEEP_LIMIT=<n>
 *  SYNC_COMMERCIALS_LIMIT=<n>
 */

import postgres from 'postgres'

const BUDGET = 9300                                            // unità quota disponibili
const COST   = { matches: 160, deep: 300, commercials: 110 }   // costo medio per item
const TARGET = { matches: 20, commercials: 20 }                // target fisso giornaliero
const CAP_DEEP = 40                                            // tetto di sicurezza per deep

const db = postgres(process.env.DATABASE_URL, { max: 1 })

const [m] = await db`
  SELECT
    count(*) FILTER (WHERE
      (youtube_video_id IS NULL AND youtube_searched_at IS NULL)
      OR (youtube_video_id IS NOT NULL AND youtube_tommasi_searched_at IS NULL)
    )::int AS matches_pending,
    count(*) FILTER (WHERE
      youtube_video_id IS NULL
      AND youtube_searched_at IS NOT NULL
      AND youtube_deep_searched_at IS NULL
    )::int AS deep_pending
  FROM matches WHERE round = ANY(ARRAY['F','SF','QF'])
`
const [p] = await db`
  SELECT count(*) FILTER (
    WHERE commercials_searched_at IS NULL AND (grand_slams >= 1 OR atp_peak_rank <= 30)
  )::int AS comm_pending
  FROM players
`
await db.end()

let budget = BUDGET

// Fase 1 — matches: target fisso 20 (o quanti ne restano)
const matchesLimit = Math.min(m.matches_pending, TARGET.matches)
budget -= matchesLimit * COST.matches

// Fase 3 — commercials: target fisso 20 (o quanti ne restano)
const commLimit = Math.min(p.comm_pending, TARGET.commercials)
budget -= commLimit * COST.commercials

// Fase 2 — deep: assorbe TUTTO il budget residuo.
// Quando matches/commercials si svuotano, il budget non speso da loro
// finisce qui → deep accelera da solo.
const deepLimit = Math.max(0, Math.min(
  m.deep_pending,
  CAP_DEEP,
  Math.floor(budget / COST.deep),
))

console.log(`# Planner sync — budget ${BUDGET}u`)
console.log(`# Code: matches=${m.matches_pending} deep=${m.deep_pending} commercials=${p.comm_pending}`)
console.log(`# Allocazione: matches=${matchesLimit} (~${matchesLimit * COST.matches}u) ` +
            `commercials=${commLimit} (~${commLimit * COST.commercials}u) ` +
            `deep=${deepLimit} (~${deepLimit * COST.deep}u)`)
console.log(`SYNC_MATCHES_LIMIT=${matchesLimit}`)
console.log(`SYNC_DEEP_LIMIT=${deepLimit}`)
console.log(`SYNC_COMMERCIALS_LIMIT=${commLimit}`)
