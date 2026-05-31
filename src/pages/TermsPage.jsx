export function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-4xl sm:text-5xl uppercase tracking-widest text-[var(--text-hi)]">Terms of Service</h1>
      <hr className="signal mt-3" />
      <p className="mt-3 text-sm text-[var(--muted)]">Last updated: April 2026 · Polaris MVP (local-only)</p>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-[var(--muted)]">
        <p>
          Polaris is provided as-is for personal evaluation. Content from third parties (e.g. Reddit
          excerpts or summaries) remains subject to those platforms&apos; terms and copyrights.
        </p>
        <p>
          You agree not to use Polaris to harass, threaten, or post unlawful content. You are
          responsible for material you submit in comments or local-only fields.
        </p>
        <p>
          The software and UI are offered without warranties of fitness for a particular purpose.
          We may change or discontinue this demo without notice.
        </p>
      </div>
    </div>
  )
}
