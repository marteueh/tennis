export function SectionDivider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, margin: '48px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(var(--ink-rgb),0.08)' }} />
      <div style={{ width: 32, height: 3, background: 'var(--accent)' }} />
      <div style={{ flex: 1, height: 1, background: 'rgba(var(--ink-rgb),0.08)' }} />
    </div>
  )
}
