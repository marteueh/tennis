export interface Player {
  id: number
  sackmann_id: number | null
  slug: string
  first_name: string
  last_name: string
  country_code: string | null
  hand: 'R' | 'L' | null
  birth_date: string | null
  height_cm: number | null
  atp_peak_rank: number | null
  grand_slams: number
  active_from: number | null
  active_to: number | null
  bio_it: string | null
  bio_en: string | null
  bio_source: string | null
  clerici_url: string | null
  photo_url: string | null
  photo_credit: string | null
}

export interface Tournament {
  id: number
  slug: string
  name: string
  name_it: string | null
  surface: 'Hard' | 'Clay' | 'Grass' | 'Carpet' | null
  category: 'GrandSlam' | 'Masters' | 'ATP500' | 'ATP250' | null
  country_code: string | null
  city: string | null
}

export interface Match {
  id: number
  sackmann_id: string | null
  slug: string
  tournament_id: number
  tournament?: Tournament
  year: number
  match_date: string | null
  round: 'F' | 'SF' | 'QF' | 'R16' | 'R32' | 'R64' | 'R128' | string
  surface: string | null
  winner_id: number
  loser_id: number
  winner?: Player
  loser?: Player
  winner_rank: number | null
  loser_rank: number | null
  score: string

  duration_min: number | null

  // Serve stats — winner
  w_ace: number | null
  w_df: number | null
  w_svpt: number | null
  w_1stIn: number | null
  w_1stWon: number | null
  w_2ndWon: number | null
  w_SvGms: number | null
  w_bpSaved: number | null
  w_bpFaced: number | null

  // Serve stats — loser
  l_ace: number | null
  l_df: number | null
  l_svpt: number | null
  l_1stIn: number | null
  l_1stWon: number | null
  l_2ndWon: number | null
  l_SvGms: number | null
  l_bpSaved: number | null
  l_bpFaced: number | null

  // Editorial
  youtube_video_id: string | null
  youtube_channel: string | null
  youtube_verified_at: string | null
  youtube_tommasi_id: string | null
  youtube_tommasi_channel: string | null
  youtube_tommasi_searched_at: string | null
  clerici_article_url: string | null
  clerici_excerpt_it: string | null
  clerici_source: string | null
  clerici_article_title: string | null
  clerici_verified_at: string | null
  editorial_note_it: string | null
  featured: boolean
  featured_week: string | null
}

export interface CulturalImpact {
  id: number
  type: 'book' | 'film' | 'documentary' | 'ad' | 'article' | 'quote' | 'moment'
  emoji: string | null
  title: string
  year: number | null
  author: string | null
  body: string
  url: string | null
  match_ids: number[]
  player_ids: number[]
  tournament_id: number | null
  link_level: 'direct' | 'contextual' | 'archetypal'
}

export interface Comment {
  id: number
  match_id: number
  user_id: number
  body: string
  status: 'pending' | 'approved' | 'rejected' | 'flagged'
  parent_id: number | null
  created_at: string
  updated_at: string
  moderated_at: string | null
  moderated_by: number | null
  // Joined
  user_name?: string | null
  user_email?: string | null
  user_role?: string
  match_slug?: string
  match_title?: string
}

export type UserRole = 'user' | 'trusted' | 'admin' | 'banned'

export interface AppUser {
  id: number
  email: string | null
  name: string | null
  image: string | null
  role: UserRole
  created_at: string
}

export interface Ranking {
  id: number
  player_id: number
  rank_date: string
  rank: number
  rank_points: number | null
}

export const ROUND_LABELS: Record<string, string> = {
  F:    'Finale',
  SF:   'Semifinale',
  QF:   'Quarti di Finale',
  R16:  'Ottavi di Finale',
  R32:  'Terzo Turno',
  R64:  'Secondo Turno',
  R128: 'Primo Turno',
}

export const SURFACE_LABELS: Record<string, string> = {
  Hard:   'Cemento',
  Clay:   'Terra Rossa',
  Grass:  'Erba',
  Carpet: 'Moquette',
}
