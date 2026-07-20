-- ═══════════════════════════════════════════════════════════
--  Ace Chronicle — Schema PostgreSQL
--  Dati: Jeff Sackmann / Tennis Abstract (CC-BY-NC-SA 4.0)
-- ═══════════════════════════════════════════════════════════

-- Abilita UUID se necessario
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Giocatori ────────────────────────────────────────────────

CREATE TABLE players (
  id            SERIAL PRIMARY KEY,
  sackmann_id   INTEGER UNIQUE,
  slug          TEXT UNIQUE NOT NULL,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  country_code  CHAR(3),
  hand          CHAR(1),               -- R / L
  birth_date    DATE,
  height_cm     INTEGER,
  atp_peak_rank INTEGER,
  grand_slams   INTEGER DEFAULT 0,
  active_from   INTEGER,
  active_to     INTEGER,
  bio_it        TEXT,
  bio_en        TEXT,
  clerici_url   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_players_slug ON players(slug);
CREATE INDEX idx_players_country ON players(country_code);

-- ── Tornei ───────────────────────────────────────────────────

CREATE TABLE tournaments (
  id            SERIAL PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  name_it       TEXT,
  surface       TEXT CHECK (surface IN ('Hard', 'Clay', 'Grass', 'Carpet')),
  category      TEXT CHECK (category IN ('GrandSlam', 'Masters', 'ATP500', 'ATP250')),
  country_code  CHAR(3),
  city          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tournaments_slug ON tournaments(slug);

-- ── Partite ──────────────────────────────────────────────────

CREATE TABLE matches (
  id              SERIAL PRIMARY KEY,
  sackmann_id     TEXT,
  slug            TEXT UNIQUE NOT NULL,
  tournament_id   INTEGER REFERENCES tournaments(id) ON DELETE SET NULL,
  year            SMALLINT NOT NULL,
  match_date      DATE,
  round           TEXT CHECK (round IN ('F','SF','QF','R16','R32','R64','R128')),
  surface         TEXT,
  winner_id       INTEGER REFERENCES players(id) ON DELETE SET NULL,
  loser_id        INTEGER REFERENCES players(id) ON DELETE SET NULL,
  winner_rank     SMALLINT,
  loser_rank      SMALLINT,
  score           TEXT NOT NULL,
  duration_min    SMALLINT,

  -- Statistiche servizio vincitore
  w_ace           SMALLINT,
  w_df            SMALLINT,
  w_svpt          SMALLINT,
  w_1stIn         SMALLINT,
  w_1stWon        SMALLINT,
  w_2ndWon        SMALLINT,
  w_SvGms         SMALLINT,
  w_bpSaved       SMALLINT,
  w_bpFaced       SMALLINT,

  -- Statistiche servizio perdente
  l_ace           SMALLINT,
  l_df            SMALLINT,
  l_svpt          SMALLINT,
  l_1stIn         SMALLINT,
  l_1stWon        SMALLINT,
  l_2ndWon        SMALLINT,
  l_SvGms         SMALLINT,
  l_bpSaved       SMALLINT,
  l_bpFaced       SMALLINT,

  -- Contenuto editoriale
  youtube_video_id    TEXT,
  youtube_channel     TEXT,
  youtube_verified_at TIMESTAMPTZ,
  clerici_article_url TEXT,
  clerici_excerpt_it  TEXT CHECK (char_length(clerici_excerpt_it) <= 300),
  clerici_source      TEXT,               -- es. "La Repubblica, 11 settembre 1995"
  editorial_note_it   TEXT CHECK (char_length(editorial_note_it) <= 500),
  featured            BOOLEAN DEFAULT false,
  featured_week       DATE,

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_matches_year         ON matches(year);
CREATE INDEX idx_matches_tournament   ON matches(tournament_id);
CREATE INDEX idx_matches_winner       ON matches(winner_id);
CREATE INDEX idx_matches_loser        ON matches(loser_id);
CREATE INDEX idx_matches_featured     ON matches(featured) WHERE featured = true;
CREATE INDEX idx_matches_slug         ON matches(slug);
CREATE INDEX idx_matches_youtube      ON matches(youtube_video_id) WHERE youtube_video_id IS NOT NULL;

-- ── Ranking ──────────────────────────────────────────────────

CREATE TABLE rankings (
  id          SERIAL PRIMARY KEY,
  player_id   INTEGER REFERENCES players(id) ON DELETE CASCADE,
  rank_date   DATE NOT NULL,
  rank        SMALLINT NOT NULL,
  rank_points INTEGER,
  UNIQUE (player_id, rank_date)
);

CREATE INDEX idx_rankings_player ON rankings(player_id);
CREATE INDEX idx_rankings_date   ON rankings(rank_date);

-- ── Trigger updated_at ───────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Dati iniziali: Tornei ─────────────────────────────────────

INSERT INTO tournaments (slug, name, name_it, surface, category, country_code, city) VALUES
  ('australian-open', 'Australian Open', 'Australian Open', 'Hard',  'GrandSlam', 'AUS', 'Melbourne'),
  ('roland-garros',   'Roland Garros',   'Roland Garros',   'Clay',  'GrandSlam', 'FRA', 'Paris'),
  ('wimbledon',       'Wimbledon',       'Wimbledon',       'Grass', 'GrandSlam', 'GBR', 'Wimbledon'),
  ('us-open',         'US Open',         'US Open',         'Hard',  'GrandSlam', 'USA', 'New York');

-- Attribuzione obbligatoria nei meta del sito:
-- Dati: Jeff Sackmann / Tennis Abstract (CC-BY-NC-SA 4.0)
-- https://github.com/JeffSackmann/tennis_atp
