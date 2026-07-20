import postgres from 'postgres'
import { NextResponse } from 'next/server'

// Vercel Cron: ogni lunedì alle 03:00
// vercel.json → "crons": [{ "path": "/api/cron/youtube-match", "schedule": "0 3 * * 1" }]

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY

const OFFICIAL_CHANNELS: Record<string, string> = {
  'us-open':         'UCXbboag48Qlr78zzz6SkzkQ',  // US Open Tennis Championships
  'australian-open': 'UCeTKJSW1NTAkf27nNmjWt5A',  // Australian Open
  'roland-garros':   'UCF3K1Jf8hjFW8qliei8fQ3A',  // Roland-Garros
  // Wimbledon: nessun archivio storico disponibile
}

interface MatchRow {
  id: number
  slug: string
  year: number
  score: string
  youtube_video_id: string | null
  tournament: { slug: string; name: string } | null
  winner:     { first_name: string; last_name: string } | null
  loser:      { first_name: string; last_name: string } | null
}

function getDb() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL non configurata')
  return postgres(url, { max: 3, idle_timeout: 20 })
}

async function searchMatchVideo(match: MatchRow): Promise<string | null> {
  if (!YOUTUBE_API_KEY || !match.tournament) return null

  const channelId = OFFICIAL_CHANNELS[match.tournament.slug]
  if (!channelId) return null

  const winnerName = match.winner ? `${match.winner.first_name} ${match.winner.last_name}` : ''
  const loserName  = match.loser  ? `${match.loser.first_name} ${match.loser.last_name}`  : ''
  const query      = `${winnerName} ${loserName} ${match.tournament.name} ${match.year}`

  const url = `https://www.googleapis.com/youtube/v3/search?` +
    `part=snippet&q=${encodeURIComponent(query)}&channelId=${channelId}` +
    `&type=video&maxResults=3&key=${YOUTUBE_API_KEY}`

  const res  = await fetch(url)
  const data = await res.json() as { items?: { id: { videoId: string } }[] }
  return data.items?.[0]?.id?.videoId ?? null
}

async function verifyVideoExists(videoId: string): Promise<boolean> {
  if (!YOUTUBE_API_KEY) return false
  const url  = `https://www.googleapis.com/youtube/v3/videos?part=id&id=${videoId}&key=${YOUTUBE_API_KEY}`
  const res  = await fetch(url)
  const data = await res.json() as { items?: unknown[] }
  return (data.items?.length ?? 0) > 0
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getDb()
  let processed = 0, found = 0, verified = 0

  try {
    // 1. Verifica video già abbinati
    const withVideo = await db<{ id: number; youtube_video_id: string }[]>`
      SELECT id, youtube_video_id FROM matches
      WHERE youtube_video_id IS NOT NULL
      ORDER BY youtube_verified_at ASC NULLS FIRST
      LIMIT 50
    `

    for (const m of withVideo) {
      const exists = await verifyVideoExists(m.youtube_video_id)
      if (!exists) {
        await db`UPDATE matches SET youtube_video_id = NULL, youtube_verified_at = NULL WHERE id = ${m.id}`
      } else {
        await db`UPDATE matches SET youtube_verified_at = NOW() WHERE id = ${m.id}`
        verified++
      }
    }

    // 2. Cerca video per partite che non ne hanno ancora
    const noVideo = await db`
      SELECT
        m.id, m.slug, m.year, m.score,
        row_to_json(t.*) AS tournament,
        row_to_json(w.*) AS winner,
        row_to_json(l.*) AS loser
      FROM matches m
      LEFT JOIN tournaments t ON t.id = m.tournament_id
      LEFT JOIN players w ON w.id = m.winner_id
      LEFT JOIN players l ON l.id = m.loser_id
      WHERE m.youtube_video_id IS NULL
        AND m.round IN ('F', 'SF')
      ORDER BY m.year DESC
      LIMIT 20
    `

    for (const m of noVideo as unknown as MatchRow[]) {
      processed++
      const videoId = await searchMatchVideo(m)
      if (videoId) {
        await db`
          UPDATE matches
          SET youtube_video_id = ${videoId}, youtube_verified_at = NOW()
          WHERE id = ${m.id}
        `
        found++
      }
      // Rispetta rate limit YouTube: ~10.000 unità/giorno
      await new Promise(r => setTimeout(r, 500))
    }

    await db.end()
    return NextResponse.json({ ok: true, processed, found, verified })
  } catch (err) {
    await db.end()
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
