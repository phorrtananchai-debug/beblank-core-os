type Freshness = 'Fresh' | 'Stale' | 'Unknown'

const freshnessClass: Record<Freshness, string> = {
  Fresh: 'pill-green',
  Stale: 'pill-amber',
  Unknown: 'pill',
}

export const FreshnessBadge = ({ freshness }: { freshness: Freshness }) => (
  <span className={freshnessClass[freshness]}>{freshness}</span>
)
