export function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-4xl sm:text-5xl uppercase tracking-widest text-[var(--text-hi)]">Terms of Service</h1>
      <hr className="signal mt-3" />
      <p className="mt-3 text-sm text-[var(--muted)]">Last updated: July 2026 · Polaris</p>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-[var(--muted)]">
        <p>
          Polaris is a debate platform hosted on Cloudflare. By signing in with Google and using the
          service, you agree to these terms. You must be at least 13 years old and provide an accurate
          date of birth once per account.
        </p>
        <p>
          You agree not to use Polaris to harass, threaten, spam, or post unlawful content. Comments
          and topic submissions are subject to automated moderation and human editorial review.
          Editors may verify, reject, or hide content; repeated violations may result in warnings,
          timeouts, or account restrictions enforced on the server.
        </p>
        <p>
          Stance votes, comments, saved debates, profile activity, and notifications are stored in
          Polaris&apos;s Cloudflare D1 database and tied to your Google account. Third-party article
          sources and summaries remain subject to their original publishers&apos; terms and copyrights.
        </p>
        <p>
          The service is provided as-is without warranties of fitness for a particular purpose. We may
          update features, moderation rules, or availability with reasonable notice where practicable.
        </p>
      </div>
    </div>
  )
}
