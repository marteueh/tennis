import postgres from 'postgres'
const db = postgres(process.env.DATABASE_URL, { max: 1 })
await db`ALTER TABLE matches ADD COLUMN IF NOT EXISTS clerici_source TEXT`
console.log('OK: clerici_source aggiunto')
await db.end()
