import type { ReactNode } from 'react'

interface Column {
  key: string
  label: string
  align?: 'left' | 'right'
  render?: (value: unknown, row: Record<string, unknown>) => ReactNode
}

interface Props {
  columns: Column[]
  rows: Record<string, unknown>[]
  keyField?: string
  className?: string
}

export const DataList = ({ columns, rows, keyField = 'id', className = '' }: Props) => (
  <div className={`overflow-x-auto rounded-2xl border border-black/[0.04] bg-white/70 ${className}`}>
    <table className="min-w-full text-left text-sm">
      <thead className="bg-black/[0.03] text-[10px] uppercase tracking-[0.12em] text-[var(--bb-text-muted)]">
        <tr>
          {columns.map((col) => (
            <th key={col.key} className={`px-4 py-3 ${col.align === 'right' ? 'text-right' : ''}`}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-black/[0.04]">
        {rows.map((row) => (
          <tr key={String(row[keyField] ?? '')} className="hover:bg-black/[0.02]">
            {columns.map((col) => (
              <td key={col.key} className={`px-4 py-2.5 text-sm ${col.align === 'right' ? 'text-right' : ''}`}>
                {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)
