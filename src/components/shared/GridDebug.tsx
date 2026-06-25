import { useState } from 'react'
import { useSpatial } from '../../design/spatial'

interface LayerState {
  major: boolean
  minor: boolean
  columns: boolean
  baseline: boolean
  margins: boolean
}

export const GridDebug = () => {
  const { isDebugMode, config } = useSpatial()
  const [layers, setLayers] = useState<LayerState>({
    major: true, minor: true, columns: true, baseline: true, margins: true,
  })
  const [showInspector, setShowInspector] = useState(false)

  if (!isDebugMode) return null

  const { major, minor, variant, opacity, columns } = config
  const lineColor = `rgba(0,0,0,${Math.min(opacity * 3, 0.12)})`

  const toggle = (key: keyof LayerState) => setLayers((p) => ({ ...p, [key]: !p[key] }))

  return (
    <>
      {/* Grid overlay layers */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none' }}>
        {/* Minor grid */}
        {layers.minor && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `repeating-linear-gradient(0deg, ${lineColor}, ${lineColor} 1px, transparent 1px, transparent ${minor}px),
                              repeating-linear-gradient(90deg, ${lineColor}, ${lineColor} 1px, transparent 1px, transparent ${minor}px)`,
            backgroundSize: `${minor}px ${minor}px`,
            opacity: 0.4,
          }} />
        )}
        {/* Major grid */}
        {layers.major && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `repeating-linear-gradient(0deg, ${lineColor}, ${lineColor} 1px, transparent 1px, transparent ${major}px),
                              repeating-linear-gradient(90deg, ${lineColor}, ${lineColor} 1px, transparent 1px, transparent ${major}px)`,
            backgroundSize: `${major}px ${major}px`,
            opacity: 0.7,
          }} />
        )}
        {/* Column guides */}
        {layers.columns && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', gap: 0 }}>
            {columns.map((col) => (
              <div key={col.index} style={{
                flex: 1, borderLeft: col.index > 0 ? `1px solid ${lineColor}` : 'none',
                borderRight: col.index === columns.length - 1 ? `1px solid ${lineColor}` : 'none',
                opacity: 0.5,
              }}>
                <div style={{
                  position: 'absolute', bottom: 4, left: col.start + 4,
                  fontFamily: 'Geist Mono, monospace', fontSize: '8px', color: lineColor,
                }}>{col.index + 1}</div>
              </div>
            ))}
          </div>
        )}
        {/* Baseline grid */}
        {layers.baseline && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 7px, ${lineColor} 7px, ${lineColor} 8px)`,
            backgroundSize: `100% 8px`,
            opacity: 0.3,
          }} />
        )}
        {/* Margin guides */}
        {layers.margins && (
          <div style={{
            position: 'absolute', top: 0, bottom: 0, left: '48px', right: '48px',
            borderLeft: `1px solid ${lineColor}`, borderRight: `1px solid ${lineColor}`,
            opacity: 0.3,
          }} />
        )}
      </div>

      {/* Layer toggle panel */}
      <div style={{
        position: 'fixed', bottom: 8, right: 8,
        background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: '6px', padding: '6px 10px', fontSize: '9px', lineHeight: 1.8,
        zIndex: 9999, fontFamily: 'Geist Mono, monospace',
        backdropFilter: 'blur(4px)',
      }}>
        <div style={{ fontWeight: 600, marginBottom: 2, fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999' }}>Grid Debug</div>
        {(['major', 'minor', 'columns', 'baseline', 'margins'] as const).map((key) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
            <input type="checkbox" checked={layers[key]} onChange={() => toggle(key)} style={{ width: 10, height: 10 }} />
            <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
          </label>
        ))}
        <div style={{ marginTop: 2, paddingTop: 2, borderTop: '1px solid rgba(0,0,0,0.06)', color: '#999' }}>
          {variant} · {major}px/{minor}px · {columns.length} cols
        </div>
        <div style={{ marginTop: 1, color: '#999' }}>
          <button
            onClick={() => setShowInspector((p) => !p)}
            style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: '#d97a34', cursor: 'pointer', textDecoration: 'underline' }}
            type="button"
          >
            {showInspector ? 'Hide Inspector' : 'Open Inspector'}
          </button>
        </div>
      </div>

      {/* Layout Inspector */}
      {showInspector && (
        <LayoutInspector />
      )}
    </>
  )
}

const LayoutInspector = () => {
  const { config } = useSpatial()

  return (
    <div style={{
      position: 'fixed', top: 8, right: 8, width: 280,
      background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(0,0,0,0.08)',
      borderRadius: '8px', padding: '10px 12px', fontSize: '10px',
      zIndex: 9999, fontFamily: 'Geist Mono, monospace',
      boxShadow: '0 8px 24px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto',
    }}>
      <div style={{ fontWeight: 600, marginBottom: 6, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999' }}>Layout Inspector</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
        <tbody>
          {[
            ['Variant', config.variant],
            ['Major Grid', `${config.major}px`],
            ['Minor Grid', `${config.minor}px`],
            ['Baseline', `${config.baseline.height}px`],
            ['Columns', `${config.columns.length}`],
            ['Opacity', `${config.opacity}`],
            ['Rhythm XS', `${config.rhythm.xs}px`],
            ['Rhythm SM', `${config.rhythm.sm}px`],
            ['Rhythm MD', `${config.rhythm.md}px`],
            ['Rhythm LG', `${config.rhythm.lg}px`],
            ['Rhythm XL', `${config.rhythm.xl}px`],
          ].map(([label, value]) => (
            <tr key={label}>
              <td style={{ padding: '2px 4px', color: '#999' }}>{label}</td>
              <td style={{ padding: '2px 4px', textAlign: 'right', fontWeight: 600 }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 4, paddingTop: 4, borderTop: '1px solid rgba(0,0,0,0.06)', fontSize: '8px', color: '#999' }}>
        Ctrl+Shift+G close · Ctrl+Shift+L toggle this panel
      </div>
    </div>
  )
}
