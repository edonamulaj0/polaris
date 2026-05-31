export function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-4xl sm:text-5xl uppercase tracking-widest text-[var(--text-hi)]">Privacy Policy</h1>
      <hr className="signal mt-3" />
      <p className="mt-3 text-sm text-[var(--muted)]">Last updated: April 2026 · Polaris MVP (local-only)</p>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-[var(--muted)]">
        <p>
          Sign-in is with Google (Sign in with Google). From Google we only read your name and email from the ID token and store them locally
          in your browser. Your date of birth is entered in the app and stored only in your browser—it is not in Google’s default sign-in token,
          and it is kept when you sign out of Google so you are not asked again on this device. Likes, votes, and activity history are also stored
          locally unless you clear site data. There is no Polaris-hosted account database in this MVP.
        </p>
        <p>
          If you use optional API keys in development proxies, those keys are configured in your
          environment—not embedded in shared static builds by default for the batch script path.
        </p>
        <p>
          We do not sell your data because we do not operate a commercial data collection backend
          for this MVP. Third-party services you configure separately (e.g. analytics) are governed
          by their own policies.
        </p>
      </div>
    </div>
  )
}
