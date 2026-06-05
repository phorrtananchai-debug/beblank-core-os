import type { ImportPreview } from '../../core/sheetBridge/types'

interface Props {
  preview: ImportPreview
  onConfirm: () => void
  onCancel: () => void
}

export const ImportPreviewPanel = ({ preview, onConfirm, onCancel }: Props) => {
  return (
    <div className="rounded-[28px] border border-black/[0.05] bg-[#faf9f8] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bb-text-muted)]">Import Preview</p>
          <h3 className="mt-1 text-lg font-bold">{preview.resourceName}</h3>
        </div>
        <span className="pill">{preview.createdAt}</span>
      </div>

      <div className="mt-4 flex gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-black/[0.06] bg-white px-3 py-2">
          <span className="text-xs text-[var(--bb-text-muted)]">Valid</span>
          <span className="text-sm font-bold text-[var(--bb-green)]">{preview.validCount}</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-black/[0.06] bg-white px-3 py-2">
          <span className="text-xs text-[var(--bb-text-muted)]">Invalid</span>
          <span className={`text-sm font-bold ${preview.invalidCount > 0 ? 'text-red' : 'text-[var(--bb-text-muted)]'}`}>{preview.invalidCount}</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-black/[0.06] bg-white px-3 py-2">
          <span className="text-xs text-[var(--bb-text-muted)]">Total rows</span>
          <span className="text-sm font-bold">{preview.rows.length}</span>
        </div>
      </div>

      {preview.invalidCount > 0 && (
        <div className="mt-4 rounded-2xl border border-red/20 bg-red/5 p-3">
          <p className="text-xs font-semibold text-red">Validation errors</p>
          <div className="mt-2 space-y-1">
            {preview.errors.slice(0, 10).map((err, i) => (
              <p key={i} className="text-[11px] text-red/80">
                Row {err.row}: {err.field} — {err.message}
              </p>
            ))}
            {preview.errors.length > 10 && (
              <p className="text-[11px] text-[var(--bb-text-faint)]">...and {preview.errors.length - 10} more</p>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 max-h-48 overflow-auto rounded-2xl border border-black/[0.06] bg-white">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-black/[0.06]">
              <th className="px-3 py-2 font-semibold text-[var(--bb-text-muted)]">#</th>
              {Object.keys(preview.rows[0] ?? {}).slice(0, 6).map((key) => (
                <th key={key} className="px-3 py-2 font-semibold text-[var(--bb-text-muted)]">{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.rows.slice(0, 20).map((row, i) => (
              <tr key={i} className="border-b border-black/[0.03]">
                <td className="px-3 py-1.5 text-[var(--bb-text-faint)]">{i + 1}</td>
                {Object.keys(preview.rows[0] ?? {}).slice(0, 6).map((key) => (
                  <td key={key} className="px-3 py-1.5">{String(row[key] ?? '—')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {preview.rows.length > 20 && (
          <p className="p-3 text-center text-[11px] text-[var(--bb-text-faint)]">
            Showing 20 of {preview.rows.length} rows
          </p>
        )}
      </div>

      <div className="mt-5 flex items-center justify-end gap-3">
        <button className="btn-secondary" type="button" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" type="button" onClick={onConfirm} disabled={preview.validCount === 0}>
          Import {preview.validCount} rows
        </button>
      </div>
    </div>
  )
}
