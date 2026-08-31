/**
 * A key rendered as the key it names. Shared so the readout hints and the
 * sidebar section headers cannot drift into two different-looking keycaps.
 */
export function Keycap({ children }: { children: React.ReactNode }) {
  return (
    <kbd style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: '20px', height: '20px', padding: '0 6px',
      background: '#1b150f', border: '1px solid #3a2e22', borderRadius: '5px',
      color: '#c7bcae', fontFamily: "'JetBrains Mono', monospace",
      fontSize: '11px', fontWeight: 700, lineHeight: 1, flexShrink: 0,
    }}>
      {children}
    </kbd>
  )
}
