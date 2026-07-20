"""
generate_seed.py — Ace Chronicle
Scarica dati Jeff Sackmann e genera database/seed.sql

Attribuzione: Jeff Sackmann / Tennis Abstract (CC-BY-NC-SA 4.0)
https://github.com/JeffSackmann/tennis_atp
"""

import io
import os
import re
import requests
import pandas as pd

YEARS = range(1993, 1998)

SLAM_MAP = {
    'Australian Open': 'australian-open',
    'Roland Garros':   'roland-garros',
    'Wimbledon':       'wimbledon',
    'US Open':         'us-open',
}

SURFACE_MAP = {'Hard':'Hard','Clay':'Clay','Grass':'Grass','Carpet':'Carpet','I':'Hard'}

ROUND_MAP = {
    'F':'F','SF':'SF','QF':'QF',
    'R16':'R16','R32':'R32','R64':'R64','R128':'R128',
    '3':'QF','2':'R16','1':'R32',
}

BASE = 'https://raw.githubusercontent.com/JeffSackmann/tennis_atp/master'
OUT  = os.path.join(os.path.dirname(__file__), 'seed.sql')

# Dizionario id_sackmann → {first_name, last_name, country_code, hand, birth_date, height_cm}
players_db: dict[int, dict] = {}
# slug → id_sackmann (per i giocatori senza ID nel file players)
players_by_slug: dict[str, int] = {}
match_rows: list[dict] = []


def slugify(text: str) -> str:
    text = text.lower().strip()
    replacements = [
        ('à','a'),('á','a'),('â','a'),('ã','a'),('ä','a'),('å','a'),
        ('è','e'),('é','e'),('ê','e'),('ë','e'),
        ('ì','i'),('í','i'),('î','i'),('ï','i'),
        ('ò','o'),('ó','o'),('ô','o'),('õ','o'),('ö','o'),
        ('ù','u'),('ú','u'),('û','u'),('ü','u'),
        ('ý','y'),('ñ','n'),('ç','c'),
        ('ő','o'),('ū','u'),('č','c'),('š','s'),('ž','z'),
        ('ă','a'),('ș','s'),('ț','t'),('ğ','g'),
    ]
    for a, b in replacements:
        text = text.replace(a, b)
    text = re.sub(r"[^a-z0-9\s'-]", '', text)
    text = re.sub(r"[\s']+", '-', text)
    text = re.sub(r'-+', '-', text)
    return text.strip('-')


def q(val) -> str:
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return 'NULL'
    s = str(val).strip()
    if not s or s == 'nan':
        return 'NULL'
    return "'" + s.replace("'", "''") + "'"


def qi(val) -> str:
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return 'NULL'
    try:
        return str(int(float(val)))
    except (ValueError, TypeError):
        return 'NULL'


def load_players_file() -> None:
    print('  Caricando players.csv...', end=' ', flush=True)
    url = f'{BASE}/atp_players.csv'
    r = requests.get(url, timeout=30)
    r.raise_for_status()
    df = pd.read_csv(io.StringIO(r.text))
    # Colonne: player_id, first_name, last_name, hand, dob, country_code, height, wikidata_id
    for _, row in df.iterrows():
        pid = row.get('player_id')
        if pd.isna(pid):
            continue
        dob_raw = row.get('dob')
        dob = None
        if pd.notna(dob_raw):
            try:
                dob_str = str(int(float(dob_raw)))
                if len(dob_str) == 8:
                    dob = f'{dob_str[:4]}-{dob_str[4:6]}-{dob_str[6:8]}'
            except (ValueError, TypeError):
                pass
        players_db[int(pid)] = {
            'sackmann_id': int(pid),
            'first_name':  str(row.get('name_first', '') or '').strip(),
            'last_name':   str(row.get('name_last',  '') or '').strip(),
            'country_code': str(row.get('ioc', '') or '')[:3] or None,
            'hand':        str(row.get('hand', '') or '')[:1].upper() or None,
            'birth_date':  dob,
            'height_cm':   int(float(row['height'])) if pd.notna(row.get('height')) else None,
        }
    print(f'{len(players_db)} giocatori')


def get_or_create_player(pid_raw, name: str) -> int | None:
    """Restituisce sackmann_id usato come chiave. Crea entry se non esiste."""
    if pd.notna(pid_raw):
        pid = int(float(pid_raw))
        if pid in players_db:
            return pid
        # In players_db ma non trovato — crea entry minima dal nome
        parts = name.strip().split(' ', 1)
        fname = parts[0] if parts else ''
        lname = parts[1] if len(parts) > 1 else ''
        players_db[pid] = {
            'sackmann_id': pid,
            'first_name':  fname,
            'last_name':   lname,
            'country_code': None,
            'hand':        None,
            'birth_date':  None,
            'height_cm':   None,
        }
        return pid
    return None


def process_year(year: int) -> None:
    url = f'{BASE}/atp_matches_{year}.csv'
    print(f'  Scaricando {year}...', end=' ', flush=True)
    r = requests.get(url, timeout=30)
    r.raise_for_status()
    df = pd.read_csv(io.StringIO(r.text))

    slams = df[df['tourney_name'].isin(SLAM_MAP.keys())].copy()
    print(f'{len(slams)} partite Slam')

    for _, row in slams.iterrows():
        w_id = get_or_create_player(row.get('winner_id'), str(row.get('winner_name', '')))
        l_id = get_or_create_player(row.get('loser_id'),  str(row.get('loser_name',  '')))
        if w_id is None or l_id is None:
            continue

        w_data = players_db[w_id]
        l_data = players_db[l_id]
        w_slug = slugify(f"{w_data['first_name']}-{w_data['last_name']}") or f'player-{w_id}'
        l_slug = slugify(f"{l_data['first_name']}-{l_data['last_name']}") or f'player-{l_id}'

        t_slug = SLAM_MAP.get(str(row.get('tourney_name', '')), '')
        rnd    = ROUND_MAP.get(str(row.get('round', '')), str(row.get('round', ''))[:4])
        score  = str(row.get('score', '') or '')
        if not score or score == 'nan':
            continue

        match_slug = slugify(f'{w_slug}-vs-{l_slug}-{t_slug}-{year}-{rnd.lower()}')

        match_rows.append({
            'sackmann_id':     f'{year}{str(row.get("match_num","0")).zfill(4)}',
            'slug':            match_slug,
            'tournament_slug': t_slug,
            'year':            year,
            'match_date':      str(row['tourney_date'])[:10] if pd.notna(row.get('tourney_date')) else None,
            'round':           rnd,
            'surface':         SURFACE_MAP.get(str(row.get('surface', '')), 'Hard'),
            'winner_id':       w_id,
            'loser_id':        l_id,
            'winner_rank':     row.get('winner_rank'),
            'loser_rank':      row.get('loser_rank'),
            'score':           score,
            'duration_min':    row.get('minutes'),
            'w_ace':    row.get('w_ace'),    'l_ace':    row.get('l_ace'),
            'w_df':     row.get('w_df'),     'l_df':     row.get('l_df'),
            'w_svpt':   row.get('w_svpt'),   'l_svpt':   row.get('l_svpt'),
            'w_1stIn':  row.get('w_1stIn'),  'l_1stIn':  row.get('l_1stIn'),
            'w_1stWon': row.get('w_1stWon'), 'l_1stWon': row.get('l_1stWon'),
            'w_2ndWon': row.get('w_2ndWon'), 'l_2ndWon': row.get('l_2ndWon'),
            'w_SvGms':  row.get('w_SvGms'),  'l_SvGms':  row.get('l_SvGms'),
            'w_bpSaved':row.get('w_bpSaved'),'l_bpSaved':row.get('l_bpSaved'),
            'w_bpFaced':row.get('w_bpFaced'),'l_bpFaced':row.get('l_bpFaced'),
        })


def write_sql() -> None:
    # Raccogli solo i giocatori che compaiono nelle partite
    used_ids: set[int] = set()
    for m in match_rows:
        used_ids.add(m['winner_id'])
        used_ids.add(m['loser_id'])

    # Deduplicazione slug partite
    seen_match_slugs: set[str] = set()
    unique_matches: list[dict] = []
    for m in match_rows:
        if m['slug'] not in seen_match_slugs:
            seen_match_slugs.add(m['slug'])
            unique_matches.append(m)

    # Costruisci slug → sackmann_id per le partite
    player_slug_map: dict[int, str] = {}
    for pid in used_ids:
        p = players_db[pid]
        slug = slugify(f"{p['first_name']}-{p['last_name']}") or f'player-{pid}'
        player_slug_map[pid] = slug

    lines: list[str] = []
    lines += [
        '-- ===================================================================',
        '--  Ace Chronicle -- Seed reale da Jeff Sackmann / Tennis Abstract',
        '--  Grandi Slam 1993-1997',
        '--  Licenza: CC-BY-NC-SA 4.0',
        '--  https://github.com/JeffSackmann/tennis_atp',
        '-- ===================================================================',
        '',
        'BEGIN;',
        '',
    ]

    # Tornei
    lines += [
        '-- Tornei',
        "INSERT INTO tournaments (slug, name, name_it, surface, category, country_code, city) VALUES",
        "  ('australian-open','Australian Open','Australian Open','Hard','GrandSlam','AUS','Melbourne'),",
        "  ('roland-garros','Roland Garros','Roland Garros','Clay','GrandSlam','FRA','Paris'),",
        "  ('wimbledon','Wimbledon','Wimbledon','Grass','GrandSlam','GBR','Wimbledon'),",
        "  ('us-open','US Open','US Open','Hard','GrandSlam','USA','New York')",
        "ON CONFLICT (slug) DO NOTHING;",
        '',
    ]

    # Giocatori
    lines.append('-- Giocatori')
    for pid in sorted(used_ids):
        p = players_db[pid]
        slug = player_slug_map[pid]
        hand = p['hand'] if p['hand'] in ('R', 'L') else None
        lines.append(
            f"INSERT INTO players (sackmann_id, slug, first_name, last_name, country_code, hand, height_cm, birth_date)"
            f" VALUES ({qi(p['sackmann_id'])},{q(slug)},{q(p['first_name'])},{q(p['last_name'])},"
            f"{q(p['country_code'])},{q(hand)},{qi(p['height_cm'])},{q(p['birth_date'])})"
            f" ON CONFLICT (slug) DO NOTHING;"
        )
    lines.append('')

    # Partite
    lines.append('-- Partite')
    for m in unique_matches:
        w_slug = player_slug_map.get(m['winner_id'], '')
        l_slug = player_slug_map.get(m['loser_id'],  '')
        lines.append(
            f"INSERT INTO matches"
            f" (sackmann_id,slug,tournament_id,year,match_date,round,surface,"
            f"winner_id,loser_id,winner_rank,loser_rank,score,duration_min,"
            f"w_ace,w_df,w_svpt,w_1stIn,w_1stWon,w_2ndWon,w_SvGms,w_bpSaved,w_bpFaced,"
            f"l_ace,l_df,l_svpt,l_1stIn,l_1stWon,l_2ndWon,l_SvGms,l_bpSaved,l_bpFaced)"
            f" SELECT"
            f" {q(m['sackmann_id'])},{q(m['slug'])},"
            f"(SELECT id FROM tournaments WHERE slug={q(m['tournament_slug'])}),"
            f"{qi(m['year'])},{q(m['match_date'])},{q(m['round'])},{q(m['surface'])},"
            f"(SELECT id FROM players WHERE slug={q(w_slug)}),"
            f"(SELECT id FROM players WHERE slug={q(l_slug)}),"
            f"{qi(m['winner_rank'])},{qi(m['loser_rank'])},{q(m['score'])},{qi(m['duration_min'])},"
            f"{qi(m['w_ace'])},{qi(m['w_df'])},{qi(m['w_svpt'])},{qi(m['w_1stIn'])},{qi(m['w_1stWon'])},{qi(m['w_2ndWon'])},{qi(m['w_SvGms'])},{qi(m['w_bpSaved'])},{qi(m['w_bpFaced'])},"
            f"{qi(m['l_ace'])},{qi(m['l_df'])},{qi(m['l_svpt'])},{qi(m['l_1stIn'])},{qi(m['l_1stWon'])},{qi(m['l_2ndWon'])},{qi(m['l_SvGms'])},{qi(m['l_bpSaved'])},{qi(m['l_bpFaced'])}"
            f" ON CONFLICT (slug) DO NOTHING;"
        )
    lines += [
        '',
        "-- Segna le finali degli Slam come featured",
        "UPDATE matches SET featured = true, featured_week = match_date",
        "WHERE round = 'F' AND year BETWEEN 1993 AND 1997;",
        '',
        'COMMIT;',
        '',
        f'-- {len(used_ids)} giocatori, {len(unique_matches)} partite',
    ]

    with open(OUT, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))

    print(f'\nGenerato {OUT}')
    print(f'  {len(used_ids)} giocatori')
    print(f'  {len(unique_matches)} partite')


if __name__ == '__main__':
    print('Ace Chronicle - Generate seed.sql')
    print('Attribuzione: Jeff Sackmann / Tennis Abstract (CC-BY-NC-SA 4.0)\n')
    load_players_file()
    for year in YEARS:
        process_year(year)
    write_sql()
