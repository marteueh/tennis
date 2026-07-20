import postgres from 'postgres'
const db = postgres(process.env.DATABASE_URL, { max: 1 })
const rows = await db`
  SELECT m.slug, m.year, m.round, t.name as tournament,
         m.youtube_video_id, m.clerici_article_url
  FROM matches m
  JOIN tournaments t ON t.id = m.tournament_id
  WHERE m.featured = true
  ORDER BY m.year, t.name
`
for (const r of rows) {
  console.log(`${r.year}  ${r.tournament.padEnd(20)} ${r.round}  video:${r.youtube_video_id ?? 'vuoto'}  clerici:${r.clerici_article_url ?? 'vuoto'}`)
}
await db.end()
