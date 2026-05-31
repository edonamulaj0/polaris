import { Link } from 'react-router-dom'

export function AboutPage() {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-4xl uppercase tracking-widest text-[var(--text-hi)]">About Polaris</h1>
      <hr className="signal mt-3 mb-4" />
      <p className="text-[var(--muted)]">
        Polaris is a civic-intelligence reader: it surfaces polarized debates in technology
        and science, explains what each side argues using AI, and lets you register your
        stance. Human editors review and verify AI summaries before publication.
      </p>
      <p className="mt-4 text-[var(--muted)]">
        You sign in with Google; we keep your name, email, and the birthday you enter only in your browser for comments and your
        profile (birthday stays on this device after you sign out of Google). No Polaris server account.
      </p>
      <p className="mt-4 text-[var(--muted)]">
        Discussions may come from a static curated file produced by a daily script, or from demo
        data when that file is empty.
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          to="/terms"
          className="inline-flex justify-center rounded-none border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-semibold text-[var(--text)] transition-colors hover:border-[var(--signal)] hover:text-[var(--signal)]"
        >
          Terms of Service
        </Link>
        <Link
          to="/privacy"
          className="inline-flex justify-center rounded-none border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-semibold text-[var(--text)] transition-colors hover:border-[var(--signal)] hover:text-[var(--signal)]"
        >
          Privacy Policy
        </Link>
      </div>
    </div>
  )
}
