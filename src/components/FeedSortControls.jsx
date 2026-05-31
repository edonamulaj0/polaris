const OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'recent', label: 'Most recent' },
  { value: 'popular', label: 'Most popular' },
]

export function FeedSortControls({ value, onChange, className = '', comfortable = false }) {
  const btnClass = comfortable
    ? 'rounded-none px-5 py-2.5 text-xs font-semibold uppercase tracking-wide ring-1 transition-colors'
    : 'rounded-none px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide ring-1 transition-colors'

  return (
    <div
      className={`flex flex-wrap gap-3 ${className}`}
      role="group"
      aria-label="Sort discussions"
    >
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`${btnClass} ${
            value === o.value
              ? 'bg-[var(--surface-hi)] text-[var(--text)] ring-[var(--signal)]'
              : 'text-[var(--muted)] ring-[var(--border)] hover:text-[var(--text)] hover:bg-[var(--surface-hi)]'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
