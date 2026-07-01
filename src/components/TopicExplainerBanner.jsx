export function TopicExplainerBanner() {
  return (
    <div className="mb-8 rounded-3xl bg-[var(--surface)] px-6 py-5 shadow-[var(--shadow-card)]">
      <p className="font-body text-[10px] font-semibold uppercase tracking-[.15em] text-[var(--gold)] mb-2">
        How Polaris works
      </p>
      <p className="text-sm text-[var(--muted)] leading-relaxed font-body">
        Our AI scans technology and science discussions across the internet daily, extracts the
        strongest arguments on each side, and presents them side-by-side so you can form an
        informed view. Human editors verify summaries before they are published.
      </p>
    </div>
  )
}
