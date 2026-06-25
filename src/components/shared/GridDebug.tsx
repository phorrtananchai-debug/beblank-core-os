import { useSpatial } from '../../design/spatial'

export const GridDebug = () => {
  const { isDebugMode, config } = useSpatial()
  if (!isDebugMode) return null

  const { major, columns, variant, opacity } = config

  return (
    <div
      className="bbh-grid-debug"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        pointerEvents: 'none',
        fontFamily: 'Geist Mono, monospace',
        fontSize: '8px',
        color: 'rgba(0,0,0,0.25)',
      }}
    >
      {/* Column labels */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '16px', display: 'flex', gap: 0 }}>
        {columns.map((col) => (
          <div
            key={col.index}
            style={{
              width: `${major}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderLeft: col.index > 0 ? '1px solid rgba(0,0,0,0.06)' : 'none',
              opacity: 0.5,
            }}
          >
            {col.index + 1}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div
        style={{
          position: 'fixed',
          bottom: 8,
          right: 8,
          background: 'rgba(255,255,255,0.9)',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: '4px',
          padding: '4px 8px',
          fontSize: '9px',
          lineHeight: 1.6,
          pointerEvents: 'none',
          backdropFilter: 'blur(4px)',
        }}
      >
        <div>Grid: <strong>{variant}</strong></div>
        <div>Major: {major}px · Min: {config.minor}px</div>
        <div>Opacity: {opacity}</div>
        <div>Columns: {columns.length}</div>
        <div>Ctrl+Shift+G to close</div>
      </div>
    </div>
  )
}
