import { Link } from 'react-router-dom'

export function AboutPage() {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-4xl uppercase tracking-widest text-[var(--text-hi)]">About Polaris</h1>
      <hr className="signal mt-3 mb-6" />

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold text-[var(--text)]">What Polaris is</h2>
        <p className="text-[var(--muted)]">
          Polaris is a civic-intelligence reader: it surfaces polarized debates in technology,
          science, and nature, explains what each side argues using AI, and lets you register your
          stance. Human editors review and verify summaries before they appear in the public feed.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="font-heading text-xl font-semibold text-[var(--text)]">How to use the platform</h2>
        <ol className="list-decimal space-y-3 pl-5 text-[var(--muted)]">
          <li>
            <strong className="font-medium text-[var(--text)]">Browse categories</strong> — start on
            Home or Explore to find discussions in Technology, Science, or Nature.
          </li>
          <li>
            <strong className="font-medium text-[var(--text)]">Read both sides</strong> — each
            article presents background, perspectives, evidence, and counterpoints in plain prose.
          </li>
          <li>
            <strong className="font-medium text-[var(--text)]">Register your stance</strong> — vote
            For, Against, or Neutral on published topics after signing in with Google.
          </li>
          <li>
            <strong className="font-medium text-[var(--text)]">Comment civilly</strong> — disagree
            with ideas, cite sources when claiming facts, and assume good faith.
          </li>
          <li>
            <strong className="font-medium text-[var(--text)]">Submit a topic</strong> — use Submit
            Topic to propose a new debate. Your submission stays private until an editor verifies it.
          </li>
          <li>
            <strong className="font-medium text-[var(--text)]">Wait for verification</strong> — you
            will see a pending status on your topic until it passes editorial review.
          </li>
          <li>
            <strong className="font-medium text-[var(--text)]">Track activity</strong> — your profile
            shows stances, comments, and topics you have submitted.
          </li>
        </ol>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="font-heading text-xl font-semibold text-[var(--text)]">Community guidelines</h2>
        <p className="text-[var(--muted)]">
          Polaris is built for constructive disagreement. These rules keep the space usable for everyone:
        </p>
        <ul className="list-disc space-y-2 pl-5 text-[var(--muted)]">
          <li>
            <strong className="font-medium text-[var(--text)]">Argue ideas, not people.</strong> No
            harassment, hate speech, slurs, threats, or doxxing.
          </li>
          <li>
            <strong className="font-medium text-[var(--text)]">Cite sources for factual claims.</strong>{' '}
            Do not spread deliberate misinformation or fabricated evidence.
          </li>
          <li>
            <strong className="font-medium text-[var(--text)]">Good-faith disagreement only.</strong>{' '}
            No bad-faith sealioning, brigading, or coordinated disruption.
          </li>
          <li>
            <strong className="font-medium text-[var(--text)]">Topic submissions matter.</strong> Frame
            the disagreement clearly, write a neutral description, and pick the right category.
          </li>
          <li>
            <strong className="font-medium text-[var(--text)]">Respect editorial decisions.</strong>{' '}
            Editors may reject, hide, or request changes to content that violates these guidelines.
            Repeated abuse may result in losing the ability to submit topics.
          </li>
        </ul>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="font-heading text-xl font-semibold text-[var(--text)]">Editorial process</h2>
        <p className="text-[var(--muted)]">
          Most feed articles are AI-assisted summaries of news and research, synthesised from public
          sources. User-submitted topics start as brief proposals. In all cases, a human editor
          verifies accuracy, balance, and civility before publication. Review times vary with queue
          volume; most submissions are processed within a few business days.
        </p>
        <p className="text-[var(--muted)]">
          Verified articles display a Verified badge. Unverified submissions remain visible only to
          their submitter until approved.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="font-heading text-xl font-semibold text-[var(--text)]">Account &amp; privacy</h2>
        <p className="text-[var(--muted)]">
          You sign in with Google. We store your Google account id, name, and email on our server so
          votes and topic submissions can be attributed. Your date of birth is saved once per account
          and cannot be changed afterward. Activity such as stances and comments may be kept locally on
          your device for your profile view.
        </p>
        <p className="text-[var(--muted)]">
          See our Terms of Service and Privacy Policy for full details on data use and your rights.
        </p>
      </section>

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
