interface Props {
  lines?: number
  className?: string
}

export const LoadingState = ({ lines = 3, className = '' }: Props) => (
  <div className={`flex animate-pulse flex-col gap-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className="rounded bg-black/[0.06]"
        style={{ height: '10px', width: `${100 - i * 15}%` }}
      />
    ))}
  </div>
)
