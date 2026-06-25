interface FilterOption {
  label: string
  active?: boolean
  onClick?: () => void
}

interface Props {
  placeholder?: string
  filters?: FilterOption[]
  className?: string
}

export const FilterBar = ({ placeholder = 'Search...', filters, className = '' }: Props) => (
  <div className={`flex items-center gap-2 rounded-xl border border-black/[0.06] bg-white px-3 py-2 ${className}`}>
    <input
      placeholder={placeholder}
      className="min-w-0 flex-1 border-none bg-transparent text-sm outline-none text-[var(--bb-text)] placeholder:text-[var(--bb-text-faint)]"
    />
    {filters?.map((f, i) => (
      <button
        key={i}
        type="button"
        onClick={f.onClick}
        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] transition ${
          f.active ? 'bg-black/[0.06] text-[var(--bb-text)]' : 'text-[var(--bb-text-muted)] hover:text-[var(--bb-text)]'
        }`}
      >
        {f.label}
      </button>
    ))}
  </div>
)
