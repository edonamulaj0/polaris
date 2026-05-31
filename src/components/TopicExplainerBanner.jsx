export function TopicExplainerBanner() {
  return (
    <div className="mb-8 border border-[var(--border)] border-l-2 border-l-[var(--signal)] bg-[var(--surface)] px-5 py-4">
      <p className="font-mono text-[9px] uppercase tracking-[.15em] text-[var(--signal)] mb-1">
        How Polaris works
      </p>
      <p className="text-sm text-[var(--muted)] leading-relaxed">
        Our AI scans technology and science discussions across the internet daily, extracts the
        strongest arguments on each side, and presents them side-by-side so you can form an
        informed view. Human editors verify summaries before they are published.
      </p>
    </div>
  )
}
