type Confidence = 'Real' | 'Inferred' | 'Fallback' | 'Mock' | 'Derived'

const confidenceClass: Record<Confidence, string> = {
  Real: 'pill-green',
  Inferred: 'pill-accent',
  Fallback: 'pill-amber',
  Mock: 'pill',
  Derived: 'pill-accent',
}

export const ConfidenceBadge = ({ confidence }: { confidence: Confidence }) => (
  <span className={confidenceClass[confidence]}>{confidence}</span>
)
