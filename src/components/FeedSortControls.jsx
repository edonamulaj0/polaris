const OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'recent', label: 'Most recent' },
  { value: 'popular', label: 'Most popular' },
]

export function FeedSortControls({ value, onChange, className = '', comfortable = false }) {
  const btnClass = comfortable
    ? 'rounded-full px-5 py-2.5 text-xs font-semibold transition-colors shadow-[var(--shadow-pill)]'
    : 'rounded-full px-4 py-2 text-xs font-semibold transition-colors shadow-[var(--shadow-pill)]'

  return (
    <div
      className={`flex flex-wrap gap-2 ${className}`}
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
              ? 'bg-[var(--nav-pill-active)] text-[var(--text-hi)]'
              : 'bg-[var(--nav-pill-bg)] text-[var(--muted)] hover:bg-[var(--nav-pill-hover)] hover:text-[var(--text)]'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
