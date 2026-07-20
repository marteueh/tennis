# sync-youtube.ps1
# Lanciato giornalmente da Windows Task Scheduler alle 10:00 (post reset quota Pacifico).
#
# Esegue 3 fasi sequenziali per popolare l'archivio:
#   1. MATCHES       - main video + telecronaca Tommasi/Clerici (~4-7k unita)
#   2. COMMERCIALS   - spot pubblicitari per top player (~2-3k unita)
#   3. RIASSUNTO     - conteggi finali
#
# Quota giornaliera YouTube: 10.000 unita. Budget complessivo: ~7-9k.
#
# Output -> logs/youtube-YYYY-MM-DD.log (auto-pulizia dopo 30 giorni).

$ErrorActionPreference = 'Continue'

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$logDir = Join-Path $root 'logs'
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }

$date    = Get-Date -Format 'yyyy-MM-dd'
$logFile = Join-Path $logDir "youtube-$date.log"

$envFile = Join-Path $root '.env.local'
if (-not (Test-Path $envFile)) {
  "[$date] ERRORE: .env.local non trovato" | Tee-Object -FilePath $logFile -Append
  exit 1
}
Get-Content $envFile | Where-Object { $_ -match '^[^#].+=' } | ForEach-Object {
  $p = $_ -split '=', 2
  [Environment]::SetEnvironmentVariable($p[0].Trim(), $p[1].Trim(), 'Process')
}

# Header
"" | Out-File -FilePath $logFile -Append
"============================================================" | Tee-Object -FilePath $logFile -Append
"  ACE CHRONICLE - Sync giornaliera YouTube" | Tee-Object -FilePath $logFile -Append
"  Avvio: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" | Tee-Object -FilePath $logFile -Append
"============================================================" | Tee-Object -FilePath $logFile -Append

# ---- PIANIFICAZIONE: ripartizione adattiva della quota ----
"" | Tee-Object -FilePath $logFile -Append
"+- PLANNER: calcolo ripartizione quota" | Tee-Object -FilePath $logFile -Append

$matchesLimit = 0
$deepLimit    = 0
$commLimit    = 0

try {
  $planOutput = & node database/sync-planner.mjs 2>&1
  $planOutput | Tee-Object -FilePath $logFile -Append
  foreach ($line in $planOutput) {
    if ($line -match 'SYNC_MATCHES_LIMIT=(\d+)')     { $matchesLimit = [int]$Matches[1] }
    if ($line -match 'SYNC_DEEP_LIMIT=(\d+)')        { $deepLimit    = [int]$Matches[1] }
    if ($line -match 'SYNC_COMMERCIALS_LIMIT=(\d+)') { $commLimit    = [int]$Matches[1] }
  }
} catch {
  "ERRORE PLANNER: $_ -- uso fallback 20/13/20" | Tee-Object -FilePath $logFile -Append
  $matchesLimit = 20; $deepLimit = 13; $commLimit = 20
}

# ---- FASE 1: Matches (main video + Tommasi) ----
"" | Tee-Object -FilePath $logFile -Append
"+- FASE 1/3: MATCHES (main + Tommasi/Clerici) - limit $matchesLimit" | Tee-Object -FilePath $logFile -Append
"+- inizio: $(Get-Date -Format 'HH:mm:ss')" | Tee-Object -FilePath $logFile -Append
"" | Tee-Object -FilePath $logFile -Append

if ($matchesLimit -gt 0) {
  try {
    & node database/fetch_youtube.mjs --limit $matchesLimit 2>&1 | Tee-Object -FilePath $logFile -Append
  } catch {
    "ERRORE FASE 1: $_" | Tee-Object -FilePath $logFile -Append
  }
} else {
  "  (coda vuota - fase saltata)" | Tee-Object -FilePath $logFile -Append
}

# ---- FASE 2: Deep (ricerca aggressiva canali non ufficiali) ----
"" | Tee-Object -FilePath $logFile -Append
"+- FASE 2/3: DEEP (ricerca aggressiva su non trovate) - limit $deepLimit" | Tee-Object -FilePath $logFile -Append
"+- inizio: $(Get-Date -Format 'HH:mm:ss')" | Tee-Object -FilePath $logFile -Append
"" | Tee-Object -FilePath $logFile -Append

if ($deepLimit -gt 0) {
  try {
    & node database/fetch_youtube.mjs --mode deep --limit $deepLimit 2>&1 | Tee-Object -FilePath $logFile -Append
  } catch {
    "ERRORE FASE 2: $_" | Tee-Object -FilePath $logFile -Append
  }
} else {
  "  (coda vuota - fase saltata)" | Tee-Object -FilePath $logFile -Append
}

# ---- FASE 3: Commercials (spot pubblicitari) ----
"" | Tee-Object -FilePath $logFile -Append
"+- FASE 3/3: COMMERCIALS (spot pubblicitari) - limit $commLimit" | Tee-Object -FilePath $logFile -Append
"+- inizio: $(Get-Date -Format 'HH:mm:ss')" | Tee-Object -FilePath $logFile -Append
"" | Tee-Object -FilePath $logFile -Append

if ($commLimit -gt 0) {
  try {
    & node database/fetch_youtube.mjs --mode commercials --limit $commLimit 2>&1 | Tee-Object -FilePath $logFile -Append
  } catch {
    "ERRORE FASE 3: $_" | Tee-Object -FilePath $logFile -Append
  }
} else {
  "  (coda vuota - fase saltata)" | Tee-Object -FilePath $logFile -Append
}

# ---- Riepilogo finale ----
"" | Tee-Object -FilePath $logFile -Append
"+- STATO FINALE DB" | Tee-Object -FilePath $logFile -Append
"+- chiusura: $(Get-Date -Format 'HH:mm:ss')" | Tee-Object -FilePath $logFile -Append
"" | Tee-Object -FilePath $logFile -Append

$summaryScript = @'
import postgres from 'postgres'
const db = postgres(process.env.DATABASE_URL, { max: 1 })
const [m] = await db`
  SELECT
    count(*) FILTER (WHERE youtube_video_id IS NOT NULL)::int AS con_main,
    count(*) FILTER (WHERE youtube_tommasi_id IS NOT NULL)::int AS con_tommasi,
    count(*) FILTER (WHERE youtube_video_id IS NULL AND youtube_searched_at IS NULL)::int AS main_pending,
    count(*) FILTER (WHERE youtube_video_id IS NOT NULL AND youtube_tommasi_searched_at IS NULL)::int AS tommasi_pending,
    count(*) FILTER (WHERE youtube_video_id IS NULL AND youtube_searched_at IS NOT NULL AND youtube_deep_searched_at IS NULL)::int AS deep_pending
  FROM matches WHERE round = ANY(ARRAY['F','SF','QF'])
`
const [c] = await db`
  SELECT
    count(*)::int AS spot_totali,
    count(DISTINCT (player_ids[1]))::int AS giocatori_con_spot
  FROM cultural_impacts WHERE type = 'ad'
`
console.log('  Main video F/SF/QF       :', m.con_main, '/ 637')
console.log('  Telecronache Tommasi     :', m.con_tommasi)
console.log('  Spot pubblicitari        :', c.spot_totali, '(' + c.giocatori_con_spot + ' giocatori)')
console.log()
console.log('  Main mai cercate         :', m.main_pending)
console.log('  Da ri-cercare (deep)     :', m.deep_pending)
console.log('  Tommasi in coda          :', m.tommasi_pending)
await db.end()
'@

# Il file temp DEVE stare dentro il progetto, altrimenti node non risolve node_modules
$tmpFile = Join-Path $root "database\.summary-temp.mjs"
Set-Content -Path $tmpFile -Value $summaryScript -Encoding UTF8
try {
  & node $tmpFile 2>&1 | Tee-Object -FilePath $logFile -Append
} catch {
  "ERRORE riepilogo: $_" | Tee-Object -FilePath $logFile -Append
}
Remove-Item $tmpFile -ErrorAction SilentlyContinue

"" | Tee-Object -FilePath $logFile -Append
"=== Sync completata $(Get-Date -Format 'HH:mm:ss') ===" | Tee-Object -FilePath $logFile -Append

# Pulizia log oltre 30 giorni
Get-ChildItem -Path $logDir -Filter 'youtube-*.log' |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } |
  Remove-Item -Force -ErrorAction SilentlyContinue
