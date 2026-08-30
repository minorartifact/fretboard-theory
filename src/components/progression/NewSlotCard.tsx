export function NewSlotCard({ isFocused, onClick }: { isFocused: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      title="Add chord here"
      className="h-new-slot"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '62px', height: '70px', borderRadius: '10px',
        border: isFocused ? '1px dashed #7a6f64' : '1px dashed #2e2620',
        background: isFocused ? 'rgba(200,190,178,.04)' : 'transparent',
        cursor: 'pointer', flexShrink: 0,
        transition: 'border-color .12s, background .12s',
      }}
    >
      <span style={{
        fontSize: '22px', lineHeight: 1, fontWeight: 300,
        color: isFocused ? '#7a6f64' : '#3a3028',
        transition: 'color .12s',
      }}>
        +
      </span>
    </div>
  )
}
