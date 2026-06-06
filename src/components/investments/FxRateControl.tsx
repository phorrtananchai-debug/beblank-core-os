import { useState } from 'react'
import { loadFxRate, saveFxRate } from './fxEngine'

interface Props {
  onRateChange: (rate: number) => void
}

export const FxRateControl = ({ onRateChange }: Props) => {
  const config = loadFxRate()
  const [rate, setRate] = useState(config.rate)
  const [editing, setEditing] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [initialized, setInitialized] = useState(false)

  if (!initialized) {
    onRateChange(rate)
    setInitialized(true)
  }

  const handleSave = () => {
    saveFxRate(rate)
    setDirty(false)
    setEditing(false)
    onRateChange(rate)
  }

  const sourceLabel = config.source === 'manual' ? 'Manual' : config.source === 'config' ? 'Env Config' : 'Fallback'
  const sourceColor = config.source === 'manual' ? 'var(--bb-accent)' : config.source === 'config' ? 'var(--bb-green)' : 'var(--bb-amber)'

  return (
    <div className="flex items-center gap-2 text-[10px] text-[var(--bb-text-muted)]">
      <span className="font-mono font-semibold uppercase tracking-[0.08em]">USD/THB</span>
      {editing ? (
        <>
          <input
            className="w-16 rounded-md border border-black/[0.08] bg-white px-1.5 py-0.5 text-center text-[10px] font-mono outline-none"
            type="number"
            step="0.1"
            min="1"
            max="100"
            value={rate}
            onChange={(e) => { setRate(Number(e.target.value)); setDirty(true) }}
          />
          <button className="rounded bg-[var(--bb-accent)]/10 px-1.5 py-0.5 text-[9px] font-semibold text-[var(--bb-accent)]" type="button" onClick={handleSave} disabled={!dirty}>Save</button>
          <button className="rounded bg-black/[0.05] px-1.5 py-0.5 text-[9px]" type="button" onClick={() => { setEditing(false); setRate(config.rate); setDirty(false) }}>Cancel</button>
        </>
      ) : (
        <>
          <span className="font-mono" onClick={() => setEditing(true)} style={{ cursor: 'pointer' }}>{rate.toFixed(1)}</span>
          <span className="rounded bg-black/[0.04] px-1.5 py-0.5 font-mono text-[8px] uppercase" style={{ color: sourceColor }}>{sourceLabel}</span>
          <button className="rounded bg-black/[0.04] px-1.5 py-0.5 text-[9px]" type="button" onClick={() => setEditing(true)}>Edit</button>
        </>
      )}
    </div>
  )
}
