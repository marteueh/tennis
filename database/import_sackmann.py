"""
import_sackmann.py
=================
Importa i dati del dataset Jeff Sackmann / Tennis Abstract nel database Supabase.

Attribuzione obbligatoria:
  Jeff Sackmann / Tennis Abstract (CC-BY-NC-SA 4.0)
  https://github.com/JeffSackmann/tennis_atp

Requisiti:
  pip install pandas supabase python-dotenv

Configurazione:
  Copia .env.local e aggiungi SUPABASE_SERVICE_KEY
  (usa la service_role key, non la anon key)
"""

import os
import re
import sys
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('.env.local')

SUPABASE_URL = os.environ.get('NEXT_PUBLIC_SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')  # service_role key

if not SUPABASE_URL or not SUPABASE_KEY:
    print('ERROR: configura NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_KEY in .env.local')
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Anni da importare (Sprint 1: prime stagioni iconiche)
YEARS = range(1993, 1998)  # 1993-1997

# Mapping surface Sackmann → nostro schema
SURFACE_MAP = {
    'Hard':   'Hard',
    'Clay':   'Clay',
    'Grass':  'Grass',
    'Carpet': 'Carpet',
    'I':      'Hard',   # Indoor hard
}

# Mapping round Sackmann → nostro schema
ROUND_MAP = {
    'F':   'F',
    'SF':  'SF',
    'QF':  'QF',
    'R16': 'R16',
    'R32': 'R32',
    'R64': 'R64',
    'R128':'R128',
}

# Tornei GrandSlam nel dataset Sackmann
SLAM_TOURNAMENTS = {
    'Australian Open': 'australian-open',
    'Roland Garros':   'roland-garros',
    'Wimbledon':       'wimbledon',
    'US Open':         'us-open',
}


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[àáâãäå]', 'a', text)
    text = re.sub(r'[èéêë]',   'e', text)
    text = re.sub(r'[ìíîï]',   'i', text)
    text = re.sub(r'[òóôõö]',  'o', text)
    text = re.sub(r'[ùúûü]',   'u', text)
    text = re.sub(r'[ý]',      'y', text)
    text = re.sub(r'[ñ]',      'n', text)
    text = re.sub(r'[ç]',      'c', text)
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s]+', '-', text)
    text = re.sub(r'-+', '-', text)
    return text.strip('-')


def get_or_create_player(row, prefix: str) -> int | None:
    """Crea il giocatore se non esiste e restituisce l'id."""
    first  = str(row.get(f'{prefix}_fname', '') or '').strip()
    last   = str(row.get(f'{prefix}_lname', '') or '').strip()
    ioc    = str(row.get(f'{prefix}_ioc',   '') or '').strip()
    hand   = str(row.get(f'{prefix}_hand',  '') or '').strip()
    ht     = row.get(f'{prefix}_ht')
    dob    = row.get(f'{prefix}_dob')
    sid    = row.get(f'{prefix}_id')

    if not first and not last:
        return None

    slug = slugify(f'{first}-{last}')

    # Cerca per sackmann_id
    res = supabase.table('players').select('id').eq('sackmann_id', int(sid) if pd.notna(sid) else -1).execute()
    if res.data:
        return res.data[0]['id']

    # Cerca per slug
    res = supabase.table('players').select('id').eq('slug', slug).execute()
    if res.data:
        return res.data[0]['id']

    # Crea nuovo
    data = {
        'sackmann_id': int(sid) if pd.notna(sid) else None,
        'slug':        slug,
        'first_name':  first,
        'last_name':   last,
        'country_code': ioc[:3] if ioc else None,
        'hand':        hand[:1].upper() if hand and hand[:1].upper() in ('R', 'L') else None,
        'height_cm':   int(ht) if pd.notna(ht) else None,
        'birth_date':  str(dob)[:10] if pd.notna(dob) else None,
    }
    res = supabase.table('players').insert(data).execute()
    return res.data[0]['id'] if res.data else None


def get_tournament_id(tourney_name: str) -> int | None:
    slug = SLAM_TOURNAMENTS.get(tourney_name)
    if not slug:
        return None
    res = supabase.table('tournaments').select('id').eq('slug', slug).execute()
    return res.data[0]['id'] if res.data else None


def import_year(year: int) -> None:
    url = f'https://raw.githubusercontent.com/JeffSackmann/tennis_atp/master/atp_matches_{year}.csv'
    print(f'\n→ Scaricando {year}...', end=' ', flush=True)

    try:
        df = pd.read_csv(url)
    except Exception as e:
        print(f'ERRORE: {e}')
        return

    # Filtra solo GrandSlam (fase 1)
    slams = df[df['tourney_name'].isin(SLAM_TOURNAMENTS.keys())]
    print(f'{len(slams)} partite GrandSlam trovate')

    imported = 0
    errors   = 0

    for _, row in slams.iterrows():
        try:
            winner_id = get_or_create_player(row, 'winner')
            loser_id  = get_or_create_player(row, 'loser')
            tourn_id  = get_tournament_id(str(row.get('tourney_name', '')))

            if not winner_id or not loser_id:
                continue

            # Costruisce lo slug
            wn  = slugify(f"{row.get('winner_fname','')} {row.get('winner_lname','')}")
            ln  = slugify(f"{row.get('loser_fname', '')} {row.get('loser_lname', '')}")
            tr  = slugify(str(row.get('tourney_name', '')))
            rnd = str(row.get('round', '')).lower().replace(' ', '-')
            slug = f'{wn}-vs-{ln}-{tr}-{year}-{rnd}'

            match_data = {
                'sackmann_id':  str(row.get('match_num', '')) or None,
                'slug':         slug,
                'tournament_id': tourn_id,
                'year':         year,
                'match_date':   str(row.get('tourney_date', ''))[:10] if pd.notna(row.get('tourney_date')) else None,
                'round':        ROUND_MAP.get(str(row.get('round', '')), str(row.get('round', ''))[:4]),
                'surface':      SURFACE_MAP.get(str(row.get('surface', '')), 'Hard'),
                'winner_id':    winner_id,
                'loser_id':     loser_id,
                'winner_rank':  int(row['winner_rank']) if pd.notna(row.get('winner_rank')) else None,
                'loser_rank':   int(row['loser_rank'])  if pd.notna(row.get('loser_rank'))  else None,
                'score':        str(row.get('score', '')),
                'duration_min': int(row['minutes']) if pd.notna(row.get('minutes')) else None,

                'w_ace':    _int(row.get('w_ace')),
                'w_df':     _int(row.get('w_df')),
                'w_svpt':   _int(row.get('w_svpt')),
                'w_1stIn':  _int(row.get('w_1stIn')),
                'w_1stWon': _int(row.get('w_1stWon')),
                'w_2ndWon': _int(row.get('w_2ndWon')),
                'w_SvGms':  _int(row.get('w_SvGms')),
                'w_bpSaved':_int(row.get('w_bpSaved')),
                'w_bpFaced':_int(row.get('w_bpFaced')),

                'l_ace':    _int(row.get('l_ace')),
                'l_df':     _int(row.get('l_df')),
                'l_svpt':   _int(row.get('l_svpt')),
                'l_1stIn':  _int(row.get('l_1stIn')),
                'l_1stWon': _int(row.get('l_1stWon')),
                'l_2ndWon': _int(row.get('l_2ndWon')),
                'l_SvGms':  _int(row.get('l_SvGms')),
                'l_bpSaved':_int(row.get('l_bpSaved')),
                'l_bpFaced':_int(row.get('l_bpFaced')),
            }

            supabase.table('matches').upsert(match_data, on_conflict='slug').execute()
            imported += 1

        except Exception as e:
            errors += 1
            if errors < 5:
                print(f'\n  WARN: {e}')

    print(f'  ✓ {imported} importate, {errors} errori')


def _int(val) -> int | None:
    try:
        return int(val) if pd.notna(val) else None
    except (ValueError, TypeError):
        return None


if __name__ == '__main__':
    print('Ace Chronicle — Import Sackmann')
    print('Attribuzione: Jeff Sackmann / Tennis Abstract (CC-BY-NC-SA 4.0)')
    print('https://github.com/JeffSackmann/tennis_atp\n')

    for year in YEARS:
        import_year(year)

    print('\n✅ Import completato.')
