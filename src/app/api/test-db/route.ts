import { NextResponse } from 'next/server'
import postgres from 'postgres'

export async function GET() {
  const url = process.env.DATABASE_URL
  if (!url) return NextResponse.json({ error: 'DATABASE_URL mancante' }, { status: 500 })

  try {
    const db = postgres(url, { max: 1, idle_timeout: 5, connect_timeout: 5 })
    const rows = await db`SELECT COUNT(*) as n FROM players`
    await db.end()
    return NextResponse.json({ ok: true, players: rows[0].n, url_prefix: url.slice(0, 30) })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
