/**
 * Marca come featured le partite più importanti 1980-2002
 * Regole:
 *   - Tutte le Finali dei 4 Slam → featured = true
 *   - Partite iconiche selezionate (SF/QF memorabili) → featured = true
 *   - Le 20 finali più iconiche → featured_week (usata nella homepage)
 * Uso: node database/seed_featured.mjs
 */
import postgres from 'postgres'

const db = postgres(process.env.DATABASE_URL, { max: 1 })

// ── 1. Reset featured ─────────────────────────────────────────────────────────
await db`UPDATE matches SET featured = false, featured_week = NULL`
console.log('✓ Reset featured')

// ── 2. Tutte le Finali dei Grandi Slam → featured ────────────────────────────
const { count: finalsCount } = await db`
  UPDATE matches SET featured = true
  WHERE round = 'F'
  RETURNING id
`.then(r => ({ count: r.length }))

console.log(`✓ ${finalsCount} finali marcate featured`)

// ── 3. Partite iconiche non-final ─────────────────────────────────────────────
// Slug generati dal dataset Sackmann — winner-vs-loser-torneo-anno-round
const ICONIC_NON_FINALS = [
  // Chang vs Lendl, Roland Garros 1989 R16 — il miracolo con la banana
  'michael-chang-vs-ivan-lendl-roland-garros-1989-r16',
  // Sampras piange in campo, AO 1995 SF vs Chang
  'pete-sampras-vs-michael-chang-australian-open-1995-sf',
  // McEnroe vs Lendl, Roland Garros 1984 F — la rimonta Lendl (già coperta dalle finali)
  // Agassi vs Ivanisevic, Wimbledon 1992 — già coperti dalle finali
  // Becker vs Curren, Wimbledon 1985 F — già coperta
  // Connors vs Lendl, US Open 1982 F — già coperta
  // McEnroe vs Borg, US Open 1981 F — già coperta
]

let iconicCount = 0
for (const slug of ICONIC_NON_FINALS) {
  const r = await db`UPDATE matches SET featured = true WHERE slug = ${slug} RETURNING id`
  if (r.length) { console.log(`  ✓ ${slug}`); iconicCount++ }
  else console.warn(`  ⚠ non trovata: ${slug}`)
}
console.log(`✓ ${iconicCount} partite iconiche aggiuntive marcate`)

// ── 4. featured_week — le finali più iconiche (homepage) ─────────────────────
// (winner-slug, tournament-slug, year, round, featured_week)
const FEATURED_WEEK = [
  // Leggende d'erba
  { slug_fragment: 'bjorn-borg%wimbledon-1980-f',             week: '1980-07-05' },
  { slug_fragment: 'john-mcenroe%wimbledon-1981-f',           week: '1981-07-04' },
  { slug_fragment: '%becker%wimbledon-1985-f',                week: '1985-07-07' },
  { slug_fragment: 'stefan-edberg%wimbledon-1988-f',          week: '1988-07-04' },
  { slug_fragment: 'andre-agassi%wimbledon-1992-f',           week: '1992-07-05' },
  { slug_fragment: 'pete-sampras%wimbledon-1993-f',           week: '1993-07-04' },
  { slug_fragment: 'pete-sampras%wimbledon-1994-f',           week: '1994-07-04' },
  { slug_fragment: 'pete-sampras%wimbledon-1995-f',           week: '1995-07-09' },
  { slug_fragment: 'goran-ivanisevic%wimbledon-2001-f',       week: '2001-07-09' },
  // US Open memorabili
  { slug_fragment: 'john-mcenroe%us-open-1984-f',             week: '1984-09-09' },
  { slug_fragment: 'pete-sampras%us-open-1990-f',             week: '1990-09-09' },
  { slug_fragment: 'pete-sampras%us-open-1995-f',             week: '1995-09-10' },
  { slug_fragment: 'pete-sampras%us-open-2002-f',             week: '2002-09-08' },
  // Roland Garros
  { slug_fragment: '%roland-garros-1984-f',                   week: '1984-06-10' },
  { slug_fragment: 'michael-chang%roland-garros-1989-f',      week: '1989-06-11' },
  { slug_fragment: 'andre-agassi%roland-garros-1999-f',       week: '1999-06-06' },
  // Australian Open
  { slug_fragment: '%australian-open-1995-f',                 week: '1995-01-29' },
  { slug_fragment: 'pete-sampras%australian-open-1994-f',     week: '1994-01-30' },
  // Partite non-final iconiche
  { slug_fragment: 'michael-chang%roland-garros-1989-r16',    week: '1989-06-05' },
  { slug_fragment: 'pete-sampras%australian-open-1995-sf',    week: '1995-01-26' },
]

let fwCount = 0
for (const { slug_fragment, week } of FEATURED_WEEK) {
  const r = await db`
    UPDATE matches SET featured = true, featured_week = ${week}
    WHERE slug ILIKE ${'%' + slug_fragment.replace(/%/g, '') + '%'}
      OR slug ILIKE ${slug_fragment}
    RETURNING id, slug
  `
  if (r.length) {
    console.log(`  ✓ [${week}] ${r[0].slug}`)
    fwCount++
  } else {
    console.warn(`  ⚠ non trovata: ${slug_fragment}`)
  }
}
console.log(`\n✓ ${fwCount} partite con featured_week`)

// ── Report finale ─────────────────────────────────────────────────────────────
const [{ n: totF }]  = await db`SELECT COUNT(*) AS n FROM matches WHERE featured = true`
const [{ n: totFW }] = await db`SELECT COUNT(*) AS n FROM matches WHERE featured_week IS NOT NULL`
console.log(`\n📊 Featured totali: ${totF} · Con featured_week: ${totFW}`)

await db.end()
