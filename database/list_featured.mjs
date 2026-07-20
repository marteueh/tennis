import postgres from 'postgres'
const db = postgres(process.env.DATABASE_URL, { max: 1 })
const rows = await db`
  SELECT m.id, m.slug, m.year, m.round, m.clerici_article_url,
         w.first_name || ' ' || w.last_name AS winner_name,
         l.first_name || ' ' || l.last_name AS loser_name,
         t.name AS tournament_name
  FROM matches m
  JOIN players w ON w.id = m.winner_id
  JOIN players l ON l.id = m.loser_id
  JOIN tournaments t ON t.id = m.tournament_id
  WHERE m.featured = true
  ORDER BY m.year DESC, m.round
`
for (const r of rows) {
  console.log(`${r.year} | ${r.round} | ${r.tournament_name} | ${r.winner_name} vs ${r.loser_name}`)
}
console.log('\nTOTALE:', rows.length)
await db.end()
