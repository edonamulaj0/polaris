import { Link } from 'react-router-dom'

function Section({ title, children, id }) {
  return (
    <section id={id} className="space-y-4">
      <h2 className="font-heading text-2xl font-semibold text-[var(--text-hi)]">{title}</h2>
      {children}
    </section>
  )
}

function Prose({ children }) {
  return <div className="space-y-4 text-[var(--muted)] font-body leading-relaxed">{children}</div>
}

export function AboutPage() {
  return (
    <div className="w-full">
      <header className="mb-10 pb-8">
        <h1 className="font-heading text-4xl sm:text-5xl font-semibold tracking-wide text-[var(--text-hi)]">
          About Polaris
        </h1>
        <p className="mt-3 font-heading text-lg italic text-[var(--muted)]">
          Your Anchor in Polarized Seas
        </p>
        <hr className="signal mt-6" />
        <p className="mt-5 max-w-3xl text-base text-[var(--muted)]">
          Polaris is a civic-intelligence platform built as a collaborative project between{' '}
          <strong className="font-medium text-[var(--text)]">Safety &amp; Security</strong> and{' '}
          <strong className="font-medium text-[var(--text)]">IT</strong> students. It surfaces
          polarized debates across technology, science, climate, human rights, immigration,
          politics, religion, education, and health — explains what each side argues, and lets
          signed-in users register a stance, comment, and submit new topics under human editorial
          oversight and automated moderation.
        </p>
      </header>

      <div className="space-y-12">
        <Section title="The Problem Polaris Solves">
          <Prose>
            <p>
              Most online debate happens in echo chambers. Headlines are written for clicks,
              comment sections reward outrage, and it is hard to see a fair summary of{' '}
              <em>both</em> sides of a technical or scientific disagreement.
            </p>
            <p>Polaris tries to do the opposite:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li><strong className="text-[var(--text)]">Surface</strong> real disagreements across technology, science, climate, human rights, politics, religion, education, and society.</li>
              <li><strong className="text-[var(--text)]">Explain</strong> each side in structured, readable prose — background, perspectives, evidence, counterpoints.</li>
              <li><strong className="text-[var(--text)]">Invite participation</strong> through stance voting and moderated comments on curated controversial topics.</li>
              <li><strong className="text-[var(--text)]">Gate publication</strong> so user submissions require editor review; news ingest and curated debates follow their own trust paths.</li>
            </ul>
            <p>
              The platform combines <strong className="text-[var(--text)]">automation</strong> (AI
              synthesis and moderation) with <strong className="text-[var(--text)]">human judgment</strong>{' '}
              (editorial review) because neither alone is sufficient for a trustworthy debate space.
            </p>
          </Prose>
        </Section>

        <Section title="Who Uses the Platform">
          <div className="overflow-x-auto rounded-3xl bg-[var(--surface)] shadow-[var(--shadow-card)]">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="text-left text-[var(--muted)]">
                  <th className="px-5 py-4 font-semibold">Role</th>
                  <th className="px-5 py-4 font-semibold">Access</th>
                  <th className="px-5 py-4 font-semibold">Capabilities</th>
                </tr>
              </thead>
              <tbody className="text-[var(--text)]">
                <tr className="border-t border-[var(--surface-hi)]">
                  <td className="px-5 py-4 font-medium">Visitor</td>
                  <td className="px-5 py-4 text-[var(--muted)]">Opens site without signing in</td>
                  <td className="px-5 py-4 text-[var(--muted)]">Blocked by sign-in gate</td>
                </tr>
                <tr className="border-t border-[var(--surface-hi)]">
                  <td className="px-5 py-4 font-medium">Member</td>
                  <td className="px-5 py-4 text-[var(--muted)]">Google Sign-In + date of birth (13+)</td>
                  <td className="px-5 py-4 text-[var(--muted)]">Browse, vote, comment, submit topics, view profile</td>
                </tr>
                <tr className="border-t border-[var(--surface-hi)]">
                  <td className="px-5 py-4 font-medium">Editor</td>
                  <td className="px-5 py-4 text-[var(--muted)]">Profile → Become an editor, then /manager + PIN</td>
                  <td className="px-5 py-4 text-[var(--muted)]">Review queue, verify/hide content, moderate comments</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="What the Application Contains">
          <Prose>
            <p>Key pages and features:</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {[
                ['Home', 'Today\'s Debates — main feed with sort controls'],
                ['Explore', 'Nine subject areas, 50 curated debates, weekly feature'],
                ['Discussion', 'Full article with stance bar, voting, comments'],
                ['Profile', 'Stances, comments, submitted topics'],
                ['Submit Topic', 'Propose a new debate for editorial review'],
                ['Editor Panel', 'Article queue + moderation (via profile registration)'],
              ].map(([name, desc]) => (
                <li key={name} className="rounded-2xl bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-pill)]">
                  <strong className="text-[var(--text-hi)]">{name}</strong>
                  <span className="text-[var(--muted)]"> — {desc}</span>
                </li>
              ))}
            </ul>
            <p>
              Every discussion article follows a consistent structure: <strong className="text-[var(--text)]">Lede</strong>,{' '}
              <strong className="text-[var(--text)]">Background</strong>,{' '}
              <strong className="text-[var(--text)]">Perspectives</strong>,{' '}
              <strong className="text-[var(--text)]">Evidence &amp; Data</strong>,{' '}
              <strong className="text-[var(--text)]">Counterpoint</strong>,{' '}
              <strong className="text-[var(--text)]">Implications</strong>, and{' '}
              <strong className="text-[var(--text)]">Conclusion</strong> — so readers always know where to find what.
            </p>
          </Prose>
        </Section>

        <Section title="Explore & Curated Debates">
          <Prose>
            <p>
              The Explore page organises debates into nine subject areas: Technology, Science,
              Climate Change, Human Rights, Immigration, Politics, Religion &amp; Ethics, Education,
              and Health &amp; Society.
            </p>
            <p>
              Polaris ships with <strong className="text-[var(--text)]">50 pre-built controversial topics</strong>{' '}
              (death penalty, euthanasia, social media, education, AI, and more). Each includes a
              full article, stance bar, vote widget, and moderated comment section.
            </p>
            <p>
              One curated topic is <strong className="text-[var(--text)]">featured each calendar week</strong> on
              Home and Explore — a shared focal point that rotates automatically through all 50 topics.
            </p>
          </Prose>
        </Section>

        <Section title="How a User Experiences Polaris">
          <Prose>
            <ol className="list-decimal space-y-2 pl-5">
              <li>Sign in with Google</li>
              <li>Enter date of birth once (ages 13–120)</li>
              <li>Browse Home or Explore by category</li>
              <li>Open a discussion and read all sections</li>
              <li>Register stance (For / Against / Neutral)</li>
              <li>Leave a comment (AI moderation + human review for flagged content)</li>
              <li>Optionally submit a new topic (editor review before publication)</li>
              <li>Track activity on your profile page</li>
            </ol>
          </Prose>
        </Section>

        <Section title="How Content Gets Onto the Platform">
          <Prose>
            <p><strong className="text-[var(--text)]">Pipeline A — Automated news ingest (every 6 hours):</strong> The Guardian, Hacker News, and GDELT feeds are deduplicated, categorised, AI-synthesised into Polaris format, and stored as verified ingest articles.</p>
            <p><strong className="text-[var(--text)]">Pipeline B — User topic submission:</strong> Members submit topics via the Submit Topic form. AI moderation checks the content; editors verify before public publication.</p>
            <p><strong className="text-[var(--text)]">Pipeline C — Curated debate library:</strong> Fifty controversial topics are defined with full article structure, merged into the feed on bootstrap, and seeded in the database for comments.</p>
          </Prose>
        </Section>

        <Section title="Safety, Moderation & Community Rules">
          <Prose>
            <p>Polaris is built for constructive disagreement:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li><strong className="text-[var(--text)]">Argue ideas, not people.</strong> No harassment, hate speech, slurs, threats, or doxxing.</li>
              <li><strong className="text-[var(--text)]">Cite sources for factual claims.</strong> Do not spread deliberate misinformation.</li>
              <li><strong className="text-[var(--text)]">Good-faith disagreement only.</strong> No bad-faith sealioning, brigading, or coordinated disruption.</li>
              <li><strong className="text-[var(--text)]">Topic submissions matter.</strong> Frame disagreements clearly and pick the right category.</li>
              <li><strong className="text-[var(--text)]">Respect editorial decisions.</strong> Editors may reject, hide, or request changes; repeated abuse may limit participation.</li>
            </ul>
            <p>
              Comments pass through AI moderation first. Flagged content is hidden pending editor
              review. Tiered penalties include warnings, timeouts, and permanent social bans for
              severe or repeated violations.
            </p>
          </Prose>
        </Section>

        <Section title="Account & Privacy">
          <Prose>
            <p>
              You sign in with Google. We store your Google account id, name, and email so votes
              and topic submissions can be attributed. Your date of birth is saved once per account
              and cannot be changed afterward.
            </p>
            <p>
              See our Terms of Service and Privacy Policy for full details on data use and your rights.
            </p>
          </Prose>
        </Section>
      </div>

      <div className="mt-12 flex flex-col gap-3 sm:flex-row">
        <Link
          to="/terms"
          className="inline-flex justify-center rounded-full bg-[var(--nav-pill-bg)] px-6 py-3 text-sm font-semibold text-[var(--text)] shadow-[var(--shadow-pill)] transition-colors hover:bg-[var(--nav-pill-hover)]"
        >
          Terms of Service
        </Link>
        <Link
          to="/privacy"
          className="inline-flex justify-center rounded-full bg-[var(--nav-pill-bg)] px-6 py-3 text-sm font-semibold text-[var(--text)] shadow-[var(--shadow-pill)] transition-colors hover:bg-[var(--nav-pill-hover)]"
        >
          Privacy Policy
        </Link>
      </div>
    </div>
  )
}
