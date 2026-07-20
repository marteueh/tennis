import type { Player, Match } from './types'

export function playerFullName(p: Player): string {
  return `${p.first_name} ${p.last_name}`
}

export function matchTitle(m: Match): string {
  const winner = m.winner ? playerFullName(m.winner) : 'N/D'
  const loser  = m.loser  ? playerFullName(m.loser)  : 'N/D'
  const tourn  = m.tournament?.name ?? ''
  return `${winner} b. ${loser} ${m.score} | ${tourn} ${m.year}`
}

export function formatScore(score: string): string[] {
  return score.split(' ')
}

export function pct(won: number | null, total: number | null): string {
  if (!won || !total || total === 0) return '–'
  return `${Math.round((won / total) * 100)}%`
}

export function formatDuration(minutes: number | null): string {
  if (!minutes) return '–'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m.toString().padStart(2, '0')}'` : `${m}'`
}

export function surfaceIcon(surface: string | null): string {
  switch (surface) {
    case 'Clay':   return '🟤'
    case 'Grass':  return '🟢'
    case 'Hard':   return '🔵'
    case 'Carpet': return '🟣'
    default:       return '⬛'
  }
}
