/**
 * migrate_auth_comments.mjs
 *
 * Crea le tabelle per Auth.js + sistema commenti con moderazione.
 *
 * Tabelle Auth.js (schema standard @auth/pg-adapter):
 *   - users
 *   - accounts
 *   - sessions
 *   - verification_token
 *
 * Tabelle commenti:
 *   - comments
 *
 * Idempotente: usa CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.
 *
 * Uso:
 *   node database/migrate_auth_comments.mjs
 */

import postgres from 'postgres'

const db = postgres(process.env.DATABASE_URL, { max: 1 })

console.log('— Tabelle Auth.js —')

await db`
  CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(255),
    email         VARCHAR(255) UNIQUE,
    "emailVerified" TIMESTAMPTZ,
    image         TEXT,
    role          VARCHAR(20) NOT NULL DEFAULT 'user',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ
  )
`
console.log('  ✓ users')

await db`
  CREATE TABLE IF NOT EXISTS accounts (
    id                  SERIAL PRIMARY KEY,
    "userId"            INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type                VARCHAR(255) NOT NULL,
    provider            VARCHAR(255) NOT NULL,
    "providerAccountId" VARCHAR(255) NOT NULL,
    refresh_token       TEXT,
    access_token        TEXT,
    expires_at          BIGINT,
    id_token            TEXT,
    scope               TEXT,
    session_state       TEXT,
    token_type          TEXT,
    UNIQUE (provider, "providerAccountId")
  )
`
console.log('  ✓ accounts')

await db`
  CREATE TABLE IF NOT EXISTS sessions (
    id             SERIAL PRIMARY KEY,
    "userId"       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires        TIMESTAMPTZ NOT NULL,
    "sessionToken" VARCHAR(255) NOT NULL UNIQUE
  )
`
console.log('  ✓ sessions')

await db`
  CREATE TABLE IF NOT EXISTS verification_token (
    identifier TEXT NOT NULL,
    expires    TIMESTAMPTZ NOT NULL,
    token      TEXT NOT NULL,
    PRIMARY KEY (identifier, token)
  )
`
console.log('  ✓ verification_token')

console.log('\n— Tabella commenti —')

await db`
  CREATE TABLE IF NOT EXISTS comments (
    id            SERIAL PRIMARY KEY,
    match_id      INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body          TEXT NOT NULL,
    status        VARCHAR(20) NOT NULL DEFAULT 'pending',
    parent_id     INTEGER REFERENCES comments(id) ON DELETE SET NULL,
    ip_hash       VARCHAR(64),
    flagged_count INTEGER NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    moderated_at  TIMESTAMPTZ,
    moderated_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT comments_status_check CHECK (status IN ('pending','approved','rejected','flagged'))
  )
`
console.log('  ✓ comments')

await db`CREATE INDEX IF NOT EXISTS comments_match_id_idx       ON comments(match_id)`
await db`CREATE INDEX IF NOT EXISTS comments_user_id_idx        ON comments(user_id)`
await db`CREATE INDEX IF NOT EXISTS comments_status_idx         ON comments(status)`
await db`CREATE INDEX IF NOT EXISTS comments_created_at_idx     ON comments(created_at DESC)`
console.log('  ✓ indici')

const counts = await db`
  SELECT
    (SELECT count(*) FROM users)              AS users,
    (SELECT count(*) FROM accounts)           AS accounts,
    (SELECT count(*) FROM sessions)           AS sessions,
    (SELECT count(*) FROM verification_token) AS verifications,
    (SELECT count(*) FROM comments)           AS comments
`
console.log('\n— Stato tabelle —')
for (const [k, v] of Object.entries(counts[0])) console.log(`  ${k.padEnd(15)} ${v}`)

await db.end()
console.log('\nMigrazione completata.')
