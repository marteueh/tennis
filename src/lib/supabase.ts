import postgres from 'postgres'
import type { Match, Player, Tournament, Ranking, Comment, UserRole } from './types'

let _db: ReturnType<typeof postgres> | null = null

function getDb() {
  if (_db) return _db
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL non configurata — aggiungi DATABASE_URL a .env.local')
  _db = postgres(url, { max: 10, idle_timeout: 20 })
  return _db
}

// ── Players ───────────────────────────────────────────────────────────

export async function getPlayers(params: { minSlams?: number; limit?: number; search?: string } = {}): Promise<Player[]> {
  const db = getDb()
  const { minSlams = 0, limit = 500, search } = params
  const term = search ? `%${search.toLowerCase()}%` : null
  return db<Player[]>`
    SELECT * FROM players
    WHERE grand_slams >= ${minSlams}
      ${term ? db`AND LOWER(first_name || ' ' || last_name) LIKE ${term}` : db``}
    ORDER BY grand_slams DESC NULLS LAST, atp_peak_rank ASC NULLS LAST, last_name ASC
    LIMIT ${limit}
  `
}

export async function getPlayersPaginated(params: { search?: string; page?: number; pageSize?: number } = {}): Promise<{ data: Player[]; total: number; page: number; pageSize: number; totalPages: number }> {
  const db = getDb()
  const { search, page = 1, pageSize = 60 } = params
  const term = search ? `%${search.toLowerCase()}%` : null
  const offset = (Math.max(1, page) - 1) * pageSize

  const rows = await db`
    SELECT *, COUNT(*) OVER()::int AS total_count
    FROM players
    ${term ? db`WHERE LOWER(first_name || ' ' || last_name) LIKE ${term}` : db``}
    ORDER BY
      grand_slams DESC NULLS LAST,
      atp_peak_rank ASC NULLS LAST,
      last_name ASC
    LIMIT ${pageSize} OFFSET ${offset}
  `
  const total = rows.length > 0 ? (rows[0] as { total_count: number }).total_count : 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  return { data: rows as unknown as Player[], total, page, pageSize, totalPages }
}

export async function getPlayerBySlug(slug: string): Promise<Player | null> {
  const db = getDb()
  const rows = await db<Player[]>`SELECT * FROM players WHERE slug = ${slug} LIMIT 1`
  return rows[0] ?? null
}

// ── Tournaments ───────────────────────────────────────────────────────

export async function getTournaments(): Promise<Tournament[]> {
  const db = getDb()
  return db<Tournament[]>`SELECT * FROM tournaments ORDER BY name`
}

export async function getTournamentBySlug(slug: string): Promise<Tournament | null> {
  const db = getDb()
  const rows = await db<Tournament[]>`SELECT * FROM tournaments WHERE slug = ${slug} LIMIT 1`
  return rows[0] ?? null
}

export async function getTournamentYears(slug: string): Promise<number[]> {
  const db = getDb()
  const rows = await db`
    SELECT DISTINCT m.year FROM matches m
    JOIN tournaments t ON t.id = m.tournament_id
    WHERE t.slug = ${slug}
    ORDER BY m.year DESC
  `
  return rows.map(r => r.year as number)
}

// ── Matches ───────────────────────────────────────────────────────────

export async function getFeaturedMatches(limit = 10): Promise<Match[]> {
  const db = getDb()
  const rows = await db`
    SELECT
      m.*,
      row_to_json(w.*) AS winner,
      row_to_json(l.*) AS loser,
      row_to_json(t.*) AS tournament
    FROM matches m
    LEFT JOIN players w ON w.id = m.winner_id
    LEFT JOIN players l ON l.id = m.loser_id
    LEFT JOIN tournaments t ON t.id = m.tournament_id
    WHERE m.featured = true
    ORDER BY m.featured_week DESC NULLS LAST
    LIMIT ${limit}
  `
  return rows as unknown as Match[]
}

export async function getMatchBySlug(slug: string): Promise<Match | null> {
  const db = getDb()
  const rows = await db`
    SELECT
      m.*,
      row_to_json(w.*) AS winner,
      row_to_json(l.*) AS loser,
      row_to_json(t.*) AS tournament
    FROM matches m
    LEFT JOIN players w ON w.id = m.winner_id
    LEFT JOIN players l ON l.id = m.loser_id
    LEFT JOIN tournaments t ON t.id = m.tournament_id
    WHERE m.slug = ${slug}
    LIMIT 1
  `
  return (rows[0] as unknown as Match) ?? null
}

export async function getMatches(params: {
  year?: number
  tournamentSlug?: string
  surface?: string
  round?: string
  featuredOnly?: boolean
  page?: number
  limit?: number
}): Promise<{ data: Match[]; count: number }> {
  const db = getDb()
  const { year, surface, tournamentSlug, round, featuredOnly, page = 1, limit = 20 } = params
  const offset = (page - 1) * limit

  const rows = await db`
    SELECT
      m.*,
      row_to_json(w.*) AS winner,
      row_to_json(l.*) AS loser,
      row_to_json(t.*) AS tournament,
      COUNT(*) OVER() AS total_count
    FROM matches m
    LEFT JOIN players w ON w.id = m.winner_id
    LEFT JOIN players l ON l.id = m.loser_id
    LEFT JOIN tournaments t ON t.id = m.tournament_id
    WHERE 1=1
      ${year           ? db`AND m.year = ${year}`            : db``}
      ${surface        ? db`AND m.surface = ${surface}`      : db``}
      ${tournamentSlug ? db`AND t.slug = ${tournamentSlug}`  : db``}
      ${round          ? db`AND m.round = ${round}`          : db``}
      ${featuredOnly   ? db`AND m.featured = true`           : db``}
    ORDER BY m.year DESC,
      CASE m.round WHEN 'F' THEN 1 WHEN 'SF' THEN 2 WHEN 'QF' THEN 3
                   WHEN 'R16' THEN 4 WHEN 'R32' THEN 5 WHEN 'R64' THEN 6
                   WHEN 'R128' THEN 7 ELSE 8 END ASC
    LIMIT ${limit} OFFSET ${offset}
  `

  const count = rows.length > 0 ? Number((rows[0] as unknown as { total_count: string }).total_count) : 0
  return { data: rows as unknown as Match[], count }
}

export async function getMatchesByPlayer(playerSlug: string, limit = 50): Promise<Match[]> {
  const db = getDb()
  const rows = await db`
    SELECT
      m.*,
      row_to_json(w.*) AS winner,
      row_to_json(l.*) AS loser,
      row_to_json(t.*) AS tournament
    FROM matches m
    LEFT JOIN players w ON w.id = m.winner_id
    LEFT JOIN players l ON l.id = m.loser_id
    LEFT JOIN tournaments t ON t.id = m.tournament_id
    WHERE w.slug = ${playerSlug} OR l.slug = ${playerSlug}
    ORDER BY m.match_date DESC NULLS LAST
    LIMIT ${limit}
  `
  return rows as unknown as Match[]
}

export async function getMatchesByTournament(tournamentSlug: string, year?: number): Promise<Match[]> {
  const db = getDb()
  const rows = await db`
    SELECT
      m.*,
      row_to_json(w.*) AS winner,
      row_to_json(l.*) AS loser,
      row_to_json(t.*) AS tournament
    FROM matches m
    LEFT JOIN players w ON w.id = m.winner_id
    LEFT JOIN players l ON l.id = m.loser_id
    LEFT JOIN tournaments t ON t.id = m.tournament_id
    WHERE t.slug = ${tournamentSlug}
      ${year ? db`AND m.year = ${year}` : db``}
    ORDER BY m.match_date DESC NULLS LAST
  `
  return rows as unknown as Match[]
}

// ── Cultural Impact ───────────────────────────────────────────────────

export async function getCulturalImpactsForMatch(matchId: number) {
  const db = getDb()
  const rows = await db`
    SELECT * FROM cultural_impacts
    WHERE ${matchId} = ANY(match_ids)
    ORDER BY link_level = 'direct' DESC, year ASC
  `
  return rows as unknown as import('./types').CulturalImpact[]
}

export async function getCulturalImpactsForPlayer(playerId: number) {
  const db = getDb()
  const rows = await db`
    SELECT * FROM cultural_impacts
    WHERE ${playerId} = ANY(player_ids)
    ORDER BY link_level = 'direct' DESC, year ASC
  `
  return rows as unknown as import('./types').CulturalImpact[]
}

export async function getCulturalImpactsForTournament(tournamentId: number) {
  const db = getDb()
  const rows = await db`
    SELECT * FROM cultural_impacts
    WHERE tournament_id = ${tournamentId}
      AND (match_ids = '{}' OR match_ids IS NULL)
    ORDER BY link_level = 'direct' DESC, year ASC
  `
  return rows as unknown as import('./types').CulturalImpact[]
}

export async function getCulturalImpactsForTournamentYear(tournamentSlug: string, year: number) {
  const db = getDb()
  const rows = await db`
    SELECT DISTINCT ci.*
    FROM cultural_impacts ci
    JOIN matches m ON m.id = ANY(ci.match_ids)
    JOIN tournaments t ON t.id = m.tournament_id
    WHERE t.slug = ${tournamentSlug}
      AND m.year = ${year}
    ORDER BY ci.link_level = 'direct' DESC, ci.year ASC
  `
  return rows as unknown as import('./types').CulturalImpact[]
}

// ── Admin ─────────────────────────────────────────────────────────────

export interface AdminClericiRow {
  id: number
  slug: string
  year: number
  round: string
  tournament_name: string
  winner_name: string
  loser_name: string
  match_date: string | null
  clerici_article_url: string | null
  clerici_excerpt_it: string | null
  clerici_source: string | null
}

export async function getAdminClericiMatches(): Promise<AdminClericiRow[]> {
  const db = getDb()
  const rows = await db`
    SELECT
      m.id, m.slug, m.year, m.round, m.match_date,
      m.clerici_article_url, m.clerici_excerpt_it, m.clerici_source,
      t.name AS tournament_name,
      w.first_name || ' ' || w.last_name AS winner_name,
      l.first_name || ' ' || l.last_name AS loser_name
    FROM matches m
    JOIN players     w ON w.id = m.winner_id
    JOIN players     l ON l.id = m.loser_id
    JOIN tournaments t ON t.id = m.tournament_id
    WHERE m.featured = true
    ORDER BY m.clerici_excerpt_it IS NOT NULL, m.year DESC, m.round
  `
  return rows as unknown as AdminClericiRow[]
}

export async function updateClericiData(params: {
  id: number
  clerici_article_url: string | null
  clerici_excerpt_it: string | null
  clerici_source: string | null
}): Promise<void> {
  const db = getDb()
  await db`
    UPDATE matches
    SET
      clerici_article_url = ${params.clerici_article_url},
      clerici_excerpt_it  = ${params.clerici_excerpt_it},
      clerici_source      = ${params.clerici_source}
    WHERE id = ${params.id}
  `
}

export interface AdminYoutubeRow {
  id: number
  slug: string
  year: number
  round: string
  tournament_name: string
  tournament_slug: string
  winner_name: string
  loser_name: string
  match_date: string | null
  youtube_video_id: string | null
  youtube_channel: string | null
}

export async function getAdminYoutubeMatches(params: {
  tournamentSlug?: string
  withVideo?: boolean
  limit?: number
} = {}): Promise<AdminYoutubeRow[]> {
  const db = getDb()
  const { tournamentSlug, withVideo = false, limit = 300 } = params
  const rows = await db`
    SELECT
      m.id, m.slug, m.year, m.round, m.match_date,
      m.youtube_video_id, m.youtube_channel,
      t.name AS tournament_name,
      t.slug AS tournament_slug,
      w.first_name || ' ' || w.last_name AS winner_name,
      l.first_name || ' ' || l.last_name AS loser_name
    FROM matches m
    JOIN players     w ON w.id = m.winner_id
    JOIN players     l ON l.id = m.loser_id
    JOIN tournaments t ON t.id = m.tournament_id
    WHERE m.round = ANY(ARRAY['F','SF','QF'])
      ${withVideo    ? db`AND m.youtube_video_id IS NOT NULL` : db`AND m.youtube_video_id IS NULL`}
      ${tournamentSlug ? db`AND t.slug = ${tournamentSlug}` : db``}
    ORDER BY
      (t.slug = 'wimbledon') DESC,
      m.year DESC,
      CASE m.round WHEN 'F' THEN 1 WHEN 'SF' THEN 2 WHEN 'QF' THEN 3 ELSE 4 END ASC
    LIMIT ${limit}
  `
  return rows as unknown as AdminYoutubeRow[]
}

export async function updateYoutubeData(params: {
  id: number
  youtube_video_id: string | null
  youtube_channel: string | null
}): Promise<void> {
  const db = getDb()
  if (params.youtube_video_id) {
    await db`
      UPDATE matches
      SET youtube_video_id    = ${params.youtube_video_id},
          youtube_channel     = ${params.youtube_channel},
          youtube_verified_at = NOW()
      WHERE id = ${params.id}
    `
  } else {
    await db`
      UPDATE matches
      SET youtube_video_id    = NULL,
          youtube_channel     = NULL,
          youtube_verified_at = NULL
      WHERE id = ${params.id}
    `
  }
}

// ── Admin: Players ────────────────────────────────────────────────────

export async function getAdminPlayers(params: { search?: string; limit?: number } = {}): Promise<Player[]> {
  const db = getDb()
  const { search, limit = 200 } = params
  const term = search ? `%${search.toLowerCase()}%` : null
  return db<Player[]>`
    SELECT * FROM players
    ${term ? db`WHERE LOWER(first_name || ' ' || last_name) LIKE ${term}` : db``}
    ORDER BY grand_slams DESC NULLS LAST, atp_peak_rank ASC NULLS LAST, last_name ASC
    LIMIT ${limit}
  `
}

export async function updatePlayerEditorial(params: {
  id: number
  photo_url: string | null
  photo_credit: string | null
  bio_it: string | null
  bio_en: string | null
  bio_source: string | null
  clerici_url: string | null
}): Promise<void> {
  const db = getDb()
  await db`
    UPDATE players SET
      photo_url    = ${params.photo_url},
      photo_credit = ${params.photo_credit},
      bio_it       = ${params.bio_it},
      bio_en       = ${params.bio_en},
      bio_source   = ${params.bio_source},
      clerici_url  = ${params.clerici_url}
    WHERE id = ${params.id}
  `
}

// ── Admin: Matches ────────────────────────────────────────────────────

export interface AdminMatchRow {
  id: number
  slug: string
  year: number
  round: string
  tournament_name: string
  winner_name: string
  loser_name: string
  match_date: string | null
  youtube_video_id: string | null
  editorial_note_it: string | null
  featured: boolean
}

export async function getAdminMatches(params: { search?: string; year?: number; limit?: number } = {}): Promise<AdminMatchRow[]> {
  const db = getDb()
  const { search, year, limit = 200 } = params
  const term = search ? `%${search.toLowerCase()}%` : null
  const rows = await db`
    SELECT
      m.id, m.slug, m.year, m.round, m.match_date,
      m.youtube_video_id, m.editorial_note_it, m.featured,
      t.name AS tournament_name,
      w.first_name || ' ' || w.last_name AS winner_name,
      l.first_name || ' ' || l.last_name AS loser_name
    FROM matches m
    JOIN players     w ON w.id = m.winner_id
    JOIN players     l ON l.id = m.loser_id
    JOIN tournaments t ON t.id = m.tournament_id
    WHERE 1=1
      ${term ? db`AND LOWER(w.first_name || ' ' || w.last_name || ' ' || l.first_name || ' ' || l.last_name) LIKE ${term}` : db``}
      ${year ? db`AND m.year = ${year}` : db``}
    ORDER BY m.year DESC,
      CASE m.round WHEN 'F' THEN 1 WHEN 'SF' THEN 2 WHEN 'QF' THEN 3 WHEN 'R16' THEN 4 ELSE 5 END
    LIMIT ${limit}
  `
  return rows as unknown as AdminMatchRow[]
}

export async function updateMatchEditorial(params: {
  id: number
  youtube_video_id: string | null
  youtube_channel: string | null
  editorial_note_it: string | null
  featured: boolean
}): Promise<void> {
  const db = getDb()
  await db`
    UPDATE matches SET
      youtube_video_id  = ${params.youtube_video_id},
      youtube_channel   = ${params.youtube_channel},
      editorial_note_it = ${params.editorial_note_it},
      featured          = ${params.featured}
    WHERE id = ${params.id}
  `
}

// ── Admin: Cultural Impacts CRUD ──────────────────────────────────────

export async function createCulturalImpact(params: {
  type: string
  emoji: string | null
  title: string
  year: number | null
  author: string | null
  body: string
  url: string | null
  match_ids: number[]
  player_ids: number[]
  tournament_id: number | null
  link_level: string
}): Promise<number> {
  const db = getDb()
  const rows = await db<{ id: number }[]>`
    INSERT INTO cultural_impacts (
      type, emoji, title, year, author, body, url,
      match_ids, player_ids, tournament_id, link_level
    ) VALUES (
      ${params.type}, ${params.emoji}, ${params.title}, ${params.year},
      ${params.author}, ${params.body}, ${params.url},
      ${params.match_ids}, ${params.player_ids}, ${params.tournament_id},
      ${params.link_level}
    )
    RETURNING id
  `
  return rows[0].id
}

export async function updateCulturalImpact(params: {
  id: number
  type: string
  emoji: string | null
  title: string
  year: number | null
  author: string | null
  body: string
  url: string | null
  match_ids: number[]
  player_ids: number[]
  tournament_id: number | null
  link_level: string
}): Promise<void> {
  const db = getDb()
  await db`
    UPDATE cultural_impacts SET
      type = ${params.type}, emoji = ${params.emoji}, title = ${params.title},
      year = ${params.year}, author = ${params.author}, body = ${params.body},
      url = ${params.url},
      match_ids = ${params.match_ids}, player_ids = ${params.player_ids},
      tournament_id = ${params.tournament_id}, link_level = ${params.link_level}
    WHERE id = ${params.id}
  `
}

export async function deleteCulturalImpact(id: number): Promise<void> {
  const db = getDb()
  await db`DELETE FROM cultural_impacts WHERE id = ${id}`
}

// ── Admin: counters per dashboard ─────────────────────────────────────

export interface AdminCounts {
  players: number
  matches: number
  tournaments: number
  cultural_impacts: number
  matches_with_video: number
  matches_with_clerici: number
  players_with_photo: number
  players_with_bio: number
}

export async function getAdminCounts(): Promise<AdminCounts> {
  const db = getDb()
  const [r] = await db<AdminCounts[]>`
    SELECT
      (SELECT count(*)::int FROM players)                                                  AS players,
      (SELECT count(*)::int FROM matches)                                                  AS matches,
      (SELECT count(*)::int FROM tournaments)                                              AS tournaments,
      (SELECT count(*)::int FROM cultural_impacts)                                         AS cultural_impacts,
      (SELECT count(*)::int FROM matches WHERE youtube_video_id IS NOT NULL)               AS matches_with_video,
      (SELECT count(*)::int FROM matches WHERE clerici_excerpt_it IS NOT NULL)             AS matches_with_clerici,
      (SELECT count(*)::int FROM players WHERE photo_url IS NOT NULL)                      AS players_with_photo,
      (SELECT count(*)::int FROM players WHERE bio_it IS NOT NULL OR bio_en IS NOT NULL)   AS players_with_bio
  `
  return r
}

// ── Comments ──────────────────────────────────────────────────────────

export async function getApprovedCommentsForMatch(matchId: number): Promise<Comment[]> {
  const db = getDb()
  const rows = await db<Comment[]>`
    SELECT
      c.id, c.match_id, c.user_id, c.body, c.status, c.parent_id,
      c.created_at, c.updated_at, c.moderated_at, c.moderated_by,
      u.name AS user_name,
      u.role AS user_role
    FROM comments c
    JOIN users u ON u.id = c.user_id
    WHERE c.match_id = ${matchId}
      AND c.status = 'approved'
      AND u.role != 'banned'
    ORDER BY c.created_at ASC
  `
  return rows
}

export async function getUserPendingCommentForMatch(userId: number, matchId: number): Promise<Comment | null> {
  const db = getDb()
  const rows = await db<Comment[]>`
    SELECT id, match_id, user_id, body, status, parent_id, created_at, updated_at, moderated_at, moderated_by
    FROM comments
    WHERE user_id = ${userId} AND match_id = ${matchId} AND status = 'pending'
    ORDER BY created_at DESC LIMIT 1
  `
  return rows[0] ?? null
}

export async function getUserById(id: number): Promise<{ id: number; role: UserRole; email: string | null; name: string | null } | null> {
  const db = getDb()
  const rows = await db`
    SELECT id, role, email, name FROM users WHERE id = ${id} LIMIT 1
  `
  return (rows[0] as { id: number; role: UserRole; email: string | null; name: string | null }) ?? null
}

export async function getUserApprovedCommentsCount(userId: number): Promise<number> {
  const db = getDb()
  const [r] = await db<{ count: number }[]>`
    SELECT count(*)::int AS count FROM comments WHERE user_id = ${userId} AND status = 'approved'
  `
  return r.count
}

export async function getRecentUserCommentTimestamp(userId: number): Promise<Date | null> {
  const db = getDb()
  const rows = await db`
    SELECT created_at FROM comments WHERE user_id = ${userId}
    ORDER BY created_at DESC LIMIT 1
  `
  return rows[0]?.created_at as Date | undefined ?? null
}

export async function createComment(params: {
  match_id: number
  user_id: number
  body: string
  status: 'pending' | 'approved'
  ip_hash: string | null
  parent_id?: number | null
}): Promise<number> {
  const db = getDb()
  const rows = await db<{ id: number }[]>`
    INSERT INTO comments (match_id, user_id, body, status, ip_hash, parent_id)
    VALUES (${params.match_id}, ${params.user_id}, ${params.body},
            ${params.status}, ${params.ip_hash}, ${params.parent_id ?? null})
    RETURNING id
  `
  return rows[0].id
}

// ── Admin: comments moderation ────────────────────────────────────────

export interface AdminCommentRow extends Comment {
  user_email: string
  user_name: string | null
  user_role: UserRole
  match_slug: string
  match_year: number
  match_round: string
  match_winner_name: string
  match_loser_name: string
  match_tournament_name: string
}

export async function getAdminComments(params: {
  status?: 'pending' | 'approved' | 'rejected' | 'flagged' | 'all'
  search?: string
  limit?: number
} = {}): Promise<AdminCommentRow[]> {
  const db = getDb()
  const { status = 'pending', search, limit = 100 } = params
  const term = search ? `%${search.toLowerCase()}%` : null
  const rows = await db`
    SELECT
      c.id, c.match_id, c.user_id, c.body, c.status, c.parent_id,
      c.created_at, c.updated_at, c.moderated_at, c.moderated_by,
      u.email AS user_email, u.name AS user_name, u.role AS user_role,
      m.slug AS match_slug, m.year AS match_year, m.round AS match_round,
      w.first_name || ' ' || w.last_name AS match_winner_name,
      l.first_name || ' ' || l.last_name AS match_loser_name,
      t.name AS match_tournament_name
    FROM comments c
    JOIN users u       ON u.id = c.user_id
    JOIN matches m     ON m.id = c.match_id
    JOIN players w     ON w.id = m.winner_id
    JOIN players l     ON l.id = m.loser_id
    JOIN tournaments t ON t.id = m.tournament_id
    WHERE 1=1
      ${status === 'all' ? db`` : db`AND c.status = ${status}`}
      ${term ? db`AND (LOWER(c.body) LIKE ${term} OR LOWER(u.email) LIKE ${term})` : db``}
    ORDER BY
      CASE c.status WHEN 'flagged' THEN 1 WHEN 'pending' THEN 2 ELSE 3 END,
      c.created_at DESC
    LIMIT ${limit}
  `
  return rows as unknown as AdminCommentRow[]
}

export async function getAdminCommentCounts(): Promise<{ pending: number; approved: number; rejected: number; flagged: number }> {
  const db = getDb()
  const [r] = await db<{ pending: number; approved: number; rejected: number; flagged: number }[]>`
    SELECT
      count(*) FILTER (WHERE status = 'pending')::int   AS pending,
      count(*) FILTER (WHERE status = 'approved')::int  AS approved,
      count(*) FILTER (WHERE status = 'rejected')::int  AS rejected,
      count(*) FILTER (WHERE status = 'flagged')::int   AS flagged
    FROM comments
  `
  return r
}

export async function moderateComment(params: { id: number; status: 'approved' | 'rejected'; moderatorId: number }): Promise<void> {
  const db = getDb()
  await db`
    UPDATE comments SET status = ${params.status}, moderated_at = NOW(), moderated_by = ${params.moderatorId}, updated_at = NOW()
    WHERE id = ${params.id}
  `
}

export async function bulkModerateComments(params: { ids: number[]; status: 'approved' | 'rejected'; moderatorId: number }): Promise<number> {
  const db = getDb()
  if (params.ids.length === 0) return 0
  const r = await db`
    UPDATE comments SET status = ${params.status}, moderated_at = NOW(), moderated_by = ${params.moderatorId}, updated_at = NOW()
    WHERE id = ANY(${params.ids})
  `
  return r.count
}

export async function setUserRole(userId: number, role: UserRole): Promise<void> {
  const db = getDb()
  await db`UPDATE users SET role = ${role} WHERE id = ${userId}`
}

export async function deleteUserAccount(userId: number): Promise<void> {
  const db = getDb()
  // Cascading FKs: accounts, sessions, comments tutti su userId con ON DELETE CASCADE
  await db`UPDATE users SET email = NULL, name = NULL, image = NULL, deleted_at = NOW(), role = 'banned' WHERE id = ${userId}`
  await db`DELETE FROM sessions WHERE "userId" = ${userId}`
  await db`DELETE FROM accounts WHERE "userId" = ${userId}`
  await db`DELETE FROM comments WHERE user_id = ${userId}`
}

// ── Rankings ──────────────────────────────────────────────────────────

export async function getPlayerRankings(playerId: number): Promise<Ranking[]> {
  const db = getDb()
  return db<Ranking[]>`
    SELECT * FROM rankings
    WHERE player_id = ${playerId}
    ORDER BY rank_date ASC
  `
}
