import { pct } from '@/lib/utils'

interface StatRowProps {
  label: string
  winnerValue: number | null
  loserValue: number | null
  total?: number | null
  unit?: string
  showBar?: boolean
}

export function StatRow({ label, winnerValue, loserValue, total, unit = '', showBar = true }: StatRowProps) {
  const wVal = winnerValue ?? 0
  const lVal = loserValue ?? 0
  const sum  = wVal + lVal

  const wWidth = sum > 0 ? (wVal / sum) * 100 : 50
  const lWidth = 100 - wWidth

  const display = (v: number | null | undefined) => {
    if (v == null) return '–'
    if (total) return pct(v, total)
    return `${v}${unit}`
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontFamily: "'Bebas Neue', Impact, sans-serif",
            fontSize: 24,
            color: '#B54A2C',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {display(winnerValue)}
        </span>
        <span
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#7C7568',
            textAlign: 'center',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: "'Bebas Neue', Impact, sans-serif",
            fontSize: 24,
            color: 'rgba(28,26,23,0.35)',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {display(loserValue)}
        </span>
      </div>

      {showBar && sum > 0 && (
        <div style={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <div
            style={{
              flex: wWidth,
              height: 3,
              borderRadius: '1.5px 0 0 1.5px',
              background: '#B54A2C',
            }}
          />
          <div
            style={{
              width: 1,
              height: 6,
              background: 'rgba(28,26,23,0.15)',
              flexShrink: 0,
            }}
          />
          <div
            style={{
              flex: lWidth,
              height: 3,
              borderRadius: '0 1.5px 1.5px 0',
              background: 'rgba(28,26,23,0.15)',
            }}
          />
        </div>
      )}
    </div>
  )
}

interface StatsBlockProps {
  winnerName: string
  loserName: string
  wAce: number | null
  lAce: number | null
  wDf: number | null
  lDf: number | null
  w1stIn: number | null
  l1stIn: number | null
  w1stWon: number | null
  l1stWon: number | null
  wSvpt: number | null
  lSvpt: number | null
  w2ndWon: number | null
  l2ndWon: number | null
  wBpSaved: number | null
  lBpSaved: number | null
  wBpFaced: number | null
  lBpFaced: number | null
}

export function StatsBlock({
  winnerName,
  loserName,
  wAce, lAce,
  wDf, lDf,
  w1stIn, l1stIn,
  w1stWon, l1stWon,
  wSvpt, lSvpt,
  w2ndWon, l2ndWon,
  wBpSaved, lBpSaved,
  wBpFaced, lBpFaced,
}: StatsBlockProps) {
  return (
    <div>
      {/* Header giocatori */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 20,
          paddingBottom: 12,
          borderBottom: '1px solid rgba(28,26,23,0.08)',
        }}
      >
        <span
          style={{
            fontFamily: "'Source Serif 4', serif",
            fontSize: 16,
            color: '#B54A2C',
            letterSpacing: '0.05em',
          }}
        >
          {winnerName.toUpperCase()}
        </span>
        <span
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#7C7568',
          }}
        >
          Servizio
        </span>
        <span
          style={{
            fontFamily: "'Source Serif 4', serif",
            fontSize: 16,
            color: 'rgba(28,26,23,0.35)',
            letterSpacing: '0.05em',
          }}
        >
          {loserName.toUpperCase()}
        </span>
      </div>

      {(wAce    != null || lAce    != null) && <StatRow label="Ace"              winnerValue={wAce}    loserValue={lAce}    />}
      {(wDf     != null || lDf     != null) && <StatRow label="Doppi Falli"      winnerValue={wDf}     loserValue={lDf}     />}
      {(w1stIn  != null || l1stIn  != null) && <StatRow label="% 1ª di Servizio" winnerValue={w1stIn}  loserValue={l1stIn}  total={wSvpt}    />}
      {(w1stWon != null || l1stWon != null) && <StatRow label="Punti con 1ª"     winnerValue={w1stWon} loserValue={l1stWon} total={w1stIn}   />}
      {(w2ndWon != null || l2ndWon != null) && <StatRow label="Punti con 2ª"     winnerValue={w2ndWon} loserValue={l2ndWon} total={wSvpt && w1stIn ? wSvpt - w1stIn : null} />}
      {(wBpSaved != null || lBpSaved != null) && <StatRow label="Palle Break Sal." winnerValue={wBpSaved} loserValue={lBpSaved} total={wBpFaced} />}
    </div>
  )
}
