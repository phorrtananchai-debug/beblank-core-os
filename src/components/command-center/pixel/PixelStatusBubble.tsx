type Mood = 'calm' | 'busy' | 'review-needed' | 'offline'

const bubbleTone: Record<Mood, string> = {
  calm: 'border-green-border bg-green-soft text-green',
  busy: 'border-accent-border bg-accent-soft text-accent-strong',
  'review-needed': 'border-amber-border bg-amber-soft text-amber',
  offline: 'border-neutral-border bg-neutral-soft text-[var(--bb-text-muted)]',
}

const bubbleLabel: Record<Mood, string> = {
  calm: 'Calm',
  busy: 'Busy',
  'review-needed': 'Review',
  offline: 'Offline',
}

export const PixelStatusBubble = ({
  mood,
  size = 'md',
}: {
  mood: Mood
  size?: 'sm' | 'md'
}) => (
  <span
    className={`inline-flex items-center justify-center rounded-full border font-mono font-semibold uppercase tracking-[0.12em] ${bubbleTone[mood]} ${size === 'sm' ? 'h-5 min-w-5 px-1.5 text-[8px]' : 'h-6 min-w-6 px-2 text-[9px]'}`}
  >
    {bubbleLabel[mood]}
  </span>
)
