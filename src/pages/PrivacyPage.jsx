export function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-4xl sm:text-5xl uppercase tracking-widest text-[var(--text-hi)]">Privacy Policy</h1>
      <hr className="signal mt-3" />
      <p className="mt-3 text-sm text-[var(--muted)]">Last updated: July 2026 · Polaris</p>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-[var(--muted)]">
        <p>
          Sign-in uses Google (Sign in with Google). We verify your Google ID token on the server and
          store your Google subject ID, name, and email in Cloudflare D1 so your account works across
          devices. Your date of birth is collected once in the app, stored in D1, and cannot be changed
          after it is saved.
        </p>
        <p>
          We also store debate activity linked to your account: stance votes, comments, saved debates,
          topic submissions, moderation status, editor registration (PIN hash only — never the plain
          PIN), and in-app notifications (e.g. replies, moderation outcomes, topic approval).
        </p>
        <p>
          Google ID tokens are kept in browser memory (Zustand) for authenticated API calls and expire
          according to Google&apos;s token lifetime. Editor session tokens are kept in session storage
          for the duration of an editor panel session.
        </p>
        <p>
          Comment and topic text may be sent to third-party AI providers (e.g. Anthropic) for automated
          moderation. Optional ingest features may call The Guardian Content API when configured on
          the server. We do not sell your personal data.
        </p>
        <p>
          To stop using Polaris with your account data on our servers, sign out and contact us if you
          need account deletion. Clearing site data in your browser removes local caches but not server
          records already stored in D1.
        </p>
      </div>
    </div>
  )
}
