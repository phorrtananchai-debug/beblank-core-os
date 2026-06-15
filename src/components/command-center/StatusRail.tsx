import { ConfidenceBadge } from './ConfidenceBadge'
import { FreshnessBadge } from './FreshnessBadge'
import { ReadOnlyBadge } from './ReadOnlyBadge'

type Confidence = 'Real' | 'Inferred' | 'Fallback' | 'Mock' | 'Derived'
type Freshness = 'Fresh' | 'Stale' | 'Unknown'
type Mood = 'calm' | 'busy' | 'review-needed' | 'offline'

const moodClass: Record<Mood, string> = {
  calm: 'pill-green',
  busy: 'pill-accent',
  'review-needed': 'pill-amber',
  offline: 'pill',
}

const moodLabel: Record<Mood, string> = {
  calm: 'Calm',
  busy: 'Busy',
  'review-needed': 'Review Needed',
  offline: 'Offline',
}

const moodDot: Record<Mood, string> = {
  calm: 'bg-[#16a36a]',
  busy: 'bg-[var(--bb-accent)]',
  'review-needed': 'bg-[#c2410c]',
  offline: 'bg-black/[0.12]',
}

export const StatusRail = ({
  mood,
  confidence,
  freshness,
  readOnly = false,
  compactReadOnly = false,
  extraLabels = [],
}: {
  mood?: Mood
  confidence?: Confidence
  freshness?: Freshness
  readOnly?: boolean
  compactReadOnly?: boolean
  extraLabels?: string[]
}) => (
  <div className="flex flex-wrap items-center gap-2">
    {mood ? (
      <>
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${moodDot[mood]} ${mood === 'busy' ? 'animate-pulse' : ''}`} />
        <span className={moodClass[mood]}>{moodLabel[mood]}</span>
      </>
    ) : null}
    {confidence ? <ConfidenceBadge confidence={confidence} /> : null}
    {freshness ? <FreshnessBadge freshness={freshness} /> : null}
    {readOnly ? <ReadOnlyBadge label={compactReadOnly ? 'R/O' : undefined} /> : null}
    {extraLabels.map((label) => (
      <span key={label} className="pill">{label}</span>
    ))}
  </div>
)
