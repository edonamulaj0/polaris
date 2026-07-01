# Polaris — Platform Report

**Tagline:** *Know Both Sides*

Polaris is a civic-intelligence platform built as a collaborative project between **Safety & Security** and **IT** students. It surfaces polarized debates across **technology, science, climate, human rights, immigration, politics, religion, education, and health**, explains what each side argues, and lets signed-in users register a stance, comment, and submit new topics — all under human editorial oversight and automated moderation.

This document explains **what** the application contains, **why** it is designed this way, and **how** it works end to end. It is written so both disciplines can understand the whole system and their respective parts.

---

## Table of Contents

1. [The Problem Polaris Solves](#1-the-problem-polaris-solves)
2. [Who Uses the Platform](#2-who-uses-the-platform)
3. [What the Application Contains](#3-what-the-application-contains)
4. [Explore, Curated Debates & Weekly Feature](#4-explore-curated-debates--weekly-feature)
5. [How a User Experiences Polaris](#5-how-a-user-experiences-polaris)
6. [How Content Gets Onto the Platform](#6-how-content-gets-onto-the-platform)
7. [Safety, Moderation & Community Rules](#7-safety-moderation--community-rules)
8. [How the System Is Built (IT Overview)](#8-how-the-system-is-built-it-overview)
9. [Data Flows & Key Workflows](#9-data-flows--key-workflows)
10. [Security Considerations & Known Limitations](#10-security-considerations--known-limitations)
11. [Project Structure](#11-project-structure)
12. [Running the Project Locally](#12-running-the-project-locally)
13. [Deployment](#13-deployment)
14. [Collaboration Guide — Who Owns What](#14-collaboration-guide--who-owns-what)

---

## 1. The Problem Polaris Solves

### What

Most online debate happens in echo chambers. Headlines are written for clicks, comment sections reward outrage, and it is hard to see a fair summary of *both* sides of a technical or scientific disagreement.

Polaris tries to do the opposite:

- **Surface** real disagreements across technology, science, climate, human rights, politics, religion, education, and society.
- **Explain** each side in structured, readable prose — background, perspectives, evidence, counterpoints.
- **Invite participation** through stance voting and moderated comments on curated controversial topics.
- **Gate publication** so user submissions require editor review; news ingest and curated debates follow their own trust paths.

### Why

The platform is designed as an **educational environment** where students can study:

| Discipline | What Polaris lets you study |
|---|---|
| **Safety & Security** | Community guidelines, AI + human moderation, tiered penalties, age gating, audit trails, trust & safety trade-offs |
| **IT** | Modern web architecture, API design, cloud deployment, database modelling, AI integration, authentication |

Polaris deliberately combines **automation** (AI synthesis and moderation) with **human judgment** (editorial review) because neither alone is sufficient for a trustworthy debate space.

---

## 2. Who Uses the Platform

There are three practical roles in the application. These are not formal database roles — they describe how different people interact with Polaris.

| Role | How they access the app | What they can do |
|---|---|---|
| **Visitor** | Opens the site without signing in | Blocked by the sign-in gate — cannot use the platform |
| **Member** | Google Sign-In + one-time date of birth (must be 13+) | Browse verified articles, vote on stances, comment, submit topics, view profile |
| **Editor** | Unlocks the **Editor Panel** at `/manager` with a 4-digit PIN stored locally in the browser | Review pending articles, verify or hide content, moderate flagged comments, issue pardons, inspect user violation history |

> **Note for Safety & Security students:** The Editor role is protected only by a client-side PIN (hashed in browser storage). The backend editor API routes do not require server-side authentication. This is an intentional demo limitation and an important case study — see [Section 10](#10-security-considerations--known-limitations).

---

## 3. What the Application Contains

### Pages & Features

| Route | Page | Purpose |
|---|---|---|
| `/` | **Home** | “Today’s Debates” — main feed with sort controls and a trending strip |
| `/explore` | **Explore** | Browse nine subject areas, 50 curated debates, and the weekly featured controversy |
| `/discussion/:id` | **Discussion** | Full article with stance bar, voting widget, and comment section |
| `/profile/:username` | **Profile** | User activity — stances, comments, submitted topics (`/profile/me` = your own profile) |
| `/about` | **About** | Platform explanation, guidelines, editorial process |
| `/terms` | **Terms of Service** | Legal terms |
| `/privacy` | **Privacy Policy** | Data handling information |
| `/manager` | **Editor Panel** | Article queue + moderation dashboard (PIN-gated in browser) |

### Named Features

- **Daily Intelligence Brief** — header on the home feed
- **Weekly Controversial Debate** — one featured curated topic rotates each calendar week (Home + Explore)
- **Curated Debates** — 50 pre-built controversial topics (death penalty, euthanasia, social media, education, etc.)
- **Explore subject areas** — nine portals: Technology, Science, Climate Change, Human Rights, Immigration, Politics, Religion & Ethics, Education, Health & Society
- **Submit Topic** — modal for proposing a new debate
- **Verified badge** — shown on editor-approved articles
- **Civility score** — 0–100 indicator on each discussion
- **Stance bar** — visual distribution of For / Against / Neutral
- **Vote widget** — buttons to register Pro, Against, or Neutral
- **Comment section** — threaded comments with AI moderation
- **Trending strip / panel** — highlights active discussions
- **Feed sort controls** — Relevance, Most recent, Most popular
- **Theme toggle** — dark / light mode
- **Auth gate** — Google Sign-In + date-of-birth screen shown before the app is usable
- **Editor Panel tabs** — Pending / Verified / All articles, plus a **Moderation Panel** for flagged comments

### Article Structure

Every discussion article is broken into consistent sections so readers always know where to find what:

| Section | What it contains |
|---|---|
| **Lede** | Opening summary of the debate |
| **Background** | Context and history |
| **Perspectives** | What different sides argue |
| **Evidence & Data** | Studies, statistics, expert quotes |
| **Counterpoint** | The strongest opposing view |
| **Implications** | What happens if each side is right |
| **Conclusion** | Closing synthesis |

Each article also carries metadata: subject area, source links, civility score, and estimated stance distribution.

---

## 4. Explore, Curated Debates & Weekly Feature

> **Key section for both student groups** — this is the main debate catalogue and how users find controversial topics.

### Explore subject areas

The **Explore** page (`/explore`) is organised into **nine subject areas**. Each portal card shows a readable title (e.g. “Climate Change” for the Climate & Environment area), a short description, and links to filtered debates.

| Subject area ID | Display title | Example topics |
|---|---|---|
| Technology | Technology | AI in debate, big tech breakup, fake-news removal |
| Science | Science | Animal testing, AI and intelligence |
| Climate & Environment | Climate Change | Public transport vs. roads funding |
| Human Rights | Human Rights | Death penalty, prisoner voting, single-sex spaces |
| Immigration & Society | Immigration | Social cohesion, integration policy |
| Politics & Governance | Politics | Compulsory voting, monarchy vs. republic, cancel culture |
| Religion & Ethics | Religion & Ethics | Euthanasia, religion in politics, cultural appropriation |
| Education | Education | Grades vs. growth reports, AI homework, merit vs. diversity |
| Health & Society | Health & Society | Drug legalization, social media addiction, organ markets |

**Why these areas exist:** Real civic disagreement spans science and tech *and* rights, ethics, politics, and social policy. Grouping debates by subject area helps Safety & Security students reason about content risk by domain, and helps IT students understand how client-side filtering and metadata work.

**How filtering works:** Curated debates carry a `topicArea` field. When you click a subject portal, the app filters the merged feed client-side — so titles and links work even when the news API has no articles in that category yet.

### 50 curated controversial debates

Polaris ships with **50 pre-built debate topics** (IDs `curated-01` … `curated-50`), including:

1. Death Penalty vs. Lifetime Imprisonment  
2. Legalizing and Regulating Recreational Drugs  
3. Euthanasia and Physician-Assisted Death  
4. Compulsory Voting vs. Voluntary Elections  
5. Profit Maximization vs. Corporate Social Responsibility  
6. Licensing Parenthood  
7. Donald Trump's Economic Interventionism  
8. Fake-News Removal Within 24 Hours  
9. Prisoner Voting Rights  
10. Punishment vs. Rehabilitation in Prisons  
11. Public Transport vs. Road Infrastructure Funding  
12. Monarchy vs. Republic  
13. Cognitive and Ethical Tests for Political Candidates  
14. Social Media's Influencer Culture  
15. Hiding Likes and Follows to Protect Mental Health  
16. Breaking Up Big Tech  
17. AI in Debate Activities  
18. Parents Accessing Teen Dating Apps  
19. Is Online Dating Ruining the Dating Scene?  
20. Does Social Media Do More Harm Than Good?  
21. Is Social Media Addiction a Public-Health Crisis?  
22. Do Social Movements Need to Go Viral?  
23. Character Development vs. Academics in Schools  
24. Abolishing Grades for Personalized Growth Reports  
25. Blockchain-Certified Micro-Credentials vs. Traditional Degrees  
26. Merit-Based Admissions vs. Diversity Quotas  
27. Banning Smartphones for Children Under 13  
28. Parents Still Paying Education Taxes After Children Graduate  
29. Using AI Tools like ChatGPT for Homework  
30. Animals in Research and Animal Rights  
31. Should we normalize quitting instead of "never give up"?  
32. Do commemorative months actually raise awareness or are they just symbolic?  
33. Should toy companies stop marketing toys specifically to boys or girls?  
34. Do universities need to stop pretending all degrees have equal value?  
35. Does criminalizing low-value survival crimes do more harm than good?  
36. Should religion have no place in politics?  
37. Should single-sex spaces be defined by biological sex or gender identity?  
38. Are mental-health disorders being overdiagnosed in young adults?  
39. Should emotional harm be treated as seriously as physical harm in law?  
40. Is disaster tourism ethical?  
41. Is AI making people less intelligent?  
42. Can we create a universally objective definition of right and wrong?  
43. Is cancel culture a form of censorship?  
44. Is bullying a natural part of youth development?  
45. Are truth and justice human-made constructs?  
46. Should American football be banned?  
47. Should history classes include mandatory units on colonialism and slavery?  
48. Should cultural appropriation ever be considered a compliment?  
49. Would celebrities be better off without media coaches?  
50. Should organ markets be legalized to reduce transplant shortages?

Each curated debate includes:

- A full **article body** (lede, background, perspectives, evidence, counterpoint, implications, conclusion)
- A **stance bar** and **vote widget** so users register For / Against / Neutral
- A **moderated comment section** (same AI + editor pipeline as all other debates)

**Source of truth:** `src/data/curatedDebates.js`  
**Database seed:** `worker/migrations/005_seed_curated_debates.sql` (required for server-side comments)

### Weekly Controversial Debate

One curated topic is **featured each calendar week** on the Home page and Explore page. The selection rotates automatically based on ISO week number (cycles through all 50 topics).

- **Why:** Gives the community a shared focal point — similar to a weekly seminar topic — without manual curation every week.
- **How (IT):** `src/lib/weeklyDebate.js` computes `(weekNumber - 1) % 50` and returns the matching debate.
- **How (Safety & Security):** The same moderation rules apply; high-risk topics (euthanasia, death penalty, religion in politics) are intentionally included so students can study enforcement on sensitive content.

---

## 5. How a User Experiences Polaris

This is the step-by-step journey a member goes through:

```
Sign in with Google
        ↓
Enter date of birth (once, ages 13–120)
        ↓
Browse Home or Explore by category
        ↓
Open a discussion → read all sections
        ↓
Register stance (For / Against / Neutral)
        ↓
Leave a comment (runs through AI moderation)
        ↓
Optionally submit a new topic (also AI-moderated, then waits for editor)
        ↓
Track activity on profile page
```

### Why each step exists

| Step | Why |
|---|---|
| **Google Sign-In** | Provides a real identity anchor without building a custom password system |
| **Date of birth** | Age gate — platform is not intended for children under 13 |
| **Structured articles** | Reduces drive-by outrage; readers must engage with both sides before commenting |
| **Stance voting** | Makes disagreement visible and measurable without requiring a comment |
| **AI moderation on comments** | First line of defence before a human editor sees flagged content |
| **Editorial review on submissions** | Prevents low-quality or biased topic proposals from entering the public feed |

---

## 6. How Content Gets Onto the Platform

Content enters Polaris through **three pipelines**.

### Pipeline A — Automated News Ingest (every 6 hours)

```
Guardian API ──┐
Hacker News  ──┼──→ Deduplicate by URL ──→ Categorise ──→ AI Synthesis ──→ Store in database
GDELT API    ──┘                                              (verified)
```

**What happens:**

1. A scheduled background job runs every 6 hours on the server.
2. It fetches recent articles from **The Guardian**, **Hacker News (Algolia)**, and the **GDELT** global news database.
3. Each URL is hashed to create a unique article ID (`art-{hash}`), preventing duplicates.
4. The article is categorised into Technology, Science, or Nature.
5. An AI model rewrites the raw news into Polaris’s structured format (lede, background, perspectives, etc.).
6. The result is stored in the database with `verified = 1` and `source_type = 'ingest'`.

**Why:** Keeps the feed fresh with real-world topics without manual writing for every article.

### Pipeline B — User Topic Submission

```
User fills Submit Topic form
        ↓
AI moderation checks title + description
        ↓
Stored with verified = 0 (not public)
        ↓
Editor reviews in /manager
        ↓
Editor verifies → appears in public feed
   or hides → stays invisible
```

**What happens:**

1. A signed-in member opens **Submit Topic** and provides a title, category, their own stance, and a neutral description.
2. The same AI moderation system used for comments checks the submission before it is saved.
3. The article is stored with `verified = 0`. Only the submitter can preview it.
4. An editor opens the **Editor Panel**, reads the submission, and either verifies it, edits the “both sides” text, or hides it.
5. Once verified, the article appears in the public feed with a **Verified** badge.

**Why:** Community-driven topics are valuable, but they need human judgment before publication.

### Pipeline C — Curated Debate Library (50 topics)

```
curatedDebates.js ──→ merged into client feed on bootstrap
        ↓
005_seed_curated_debates.sql ──→ D1 articles table (for comments API)
        ↓
Users open /discussion/curated-XX → vote + moderated comments
```

**What happens:**

1. Fifty controversial topics are defined in `src/data/curatedDebates.js` with full article structure.
2. On app load, they merge into the home and explore feeds alongside news articles.
3. A SQL seed migration inserts matching rows into D1 so the comments API accepts posts on those debate IDs.
4. One topic is highlighted each week as the **Weekly Controversial Debate**.

**Why:** Provides ready-made, diverse debate material spanning politics, religion, ethics, and social policy — essential for a collab between Safety & Security and IT students — without waiting for news ingest or editor approval.

---

## 7. Safety, Moderation & Community Rules

> **This section is primarily for Safety & Security students**

### Community Guidelines (the “why” behind the rules)

Polaris is built for **constructive disagreement**. The rules in the About page boil down to:

1. **Argue ideas, not people** — no harassment, hate speech, slurs, threats, or doxxing.
2. **Cite sources for factual claims** — no deliberate misinformation.
3. **Good-faith disagreement only** — no sealioning, brigading, or coordinated disruption.
4. **Quality topic submissions** — clear framing, neutral description, correct category.
5. **Respect editorial decisions** — editors may reject, hide, or request changes.

Categories now span technology through civic and social domains (see [Section 4](#4-explore-curated-debates--weekly-feature)). **All comments on curated debates — including sensitive political and religious topics — pass through the same AI moderation and tiered penalty system.** Safety & Security students should pay special attention to how the bot handles irony, borderline content, and masking on high-emotion topics.

### The Moderation Pipeline (how enforcement works)

Every comment and topic submission passes through a **two-layer system**:

```
User posts comment
        ↓
Rate limit check (max 1 comment per 5 seconds)
        ↓
Comment saved temporarily as "visible"
        ↓
AI Moderation Bot evaluates content
        ↓
┌─────────────────────────────────────────────────────────┐
│  ALLOW        → stays visible to everyone               │
│  FLAG         → hidden from others; author sees         │
│                 "pending review"; editor notified       │
│  AUTO-DELETE  → removed; penalty applied to user        │
└─────────────────────────────────────────────────────────┘
        ↓
Editor reviews flagged queue (if applicable)
        ↓
Editor action: delete / clear / mark false positive
```

### What the AI Moderation Bot checks

The bot (powered by Anthropic Claude) evaluates each piece of content against strict rules:

| Content type | Typical bot action |
|---|---|
| Hate speech, slurs, threats, illegal content | **Auto-delete** (extreme severity) |
| Direct insults, aggressive trolling | **Auto-delete** (moderate severity) |
| Mild hostility | **Flag** for human review |
| Passive-aggression, dog-whistles, subtle attacks | **Flag** (borderline / sarcasm) |
| Heavy irony or sarcasm that could be an attack | **Flag** (irony / sarcasm) |
| Masked profanity (`sh*t`, `f**k`, asterisk bypasses) | **Flag** (masking bypass) |
| Civil but strongly opinionated discourse | **Allow** |

If the AI service is unavailable or returns an unparseable response, the system **defaults to flagging** — content is held for human review rather than being silently approved.

### Tiered Penalty System (what happens when rules are broken)

Penalties escalate based on severity and repetition. All actions are logged in an audit table (`moderation_violations`).

| Trigger | Penalty |
|---|---|
| First review-flag (mild: sarcasm, irony, borderline, masking) within 30 days | **Formal warning** |
| Repeat review-flag after a warning | **24-hour timeout** (cannot comment) |
| Second timeout | **72-hour timeout** |
| Third timeout | **Permanent social ban** |
| Auto-delete, moderate severity | **24h or 72h timeout** (escalating) |
| Auto-delete, extreme severity | **Immediate permanent social ban** + optional email notification |
| 3+ legacy strikes | **Comment blocked** |
| 5+ legacy strikes | **Banned flag** |

**Social ban** means the user can still **read** content but cannot comment, submit topics, or vote.

Editors can **pardon** users and inspect full violation history through the Moderation Panel.

### Age Verification

- Users must sign in with Google and provide a date of birth.
- Minimum age: **13 years**.
- Maximum plausible age: **120 years**.
- Date of birth is saved **once per account** and cannot be changed afterward (`birth_locked` flag in database).

### What Data Is Stored (privacy-relevant)

| Stored on server (database) | Stored locally (browser) |
|---|---|
| Google account ID, email, name | Profile preferences |
| Date of birth (write-once) | Stance voting history (currently local only) |
| Votes, comments, moderation state | Activity, likes |
| Articles, flags, violation audit log | Editor PIN hash |
| | Theme preference, Google ID token (short-lived) |

---

## 8. How the System Is Built (IT Overview)

> **This section is primarily for IT students**, but Safety & Security students should skim it to understand what the backend actually enforces versus what the UI suggests.

### Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (React single-page application)                    │
│  Vite · React 19 · Tailwind CSS · Zustand · React Query     │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS  /api/*
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Cloudflare Pages (hosts the static frontend)               │
│  Pages Function proxies /api/* → Worker service binding     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Cloudflare Worker (polaris-worker)                         │
│  Hono framework · TypeScript                                │
│                                                             │
│  ┌─────────┐  ┌────────┐  ┌──────────────┐  ┌───────────┐  │
│  │ D1 DB   │  │ KV     │  │ Workers AI   │  │ Cron job  │  │
│  │ SQLite  │  │ rate   │  │ Llama 3.3    │  │ every 6h  │  │
│  │         │  │ limits │  │ 70B          │  │ ingest    │  │
│  └─────────┘  └────────┘  └──────────────┘  └───────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
   Google OAuth     Anthropic Claude    Guardian / HN / GDELT
   (token verify)   (moderation)        (news sources)
                    Gemini (fallback
                    for synthesis)
```

### Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, Framer Motion, Zustand, TanStack React Query, React Router 7 |
| **Backend** | Cloudflare Workers, Hono 4, TypeScript |
| **Database** | Cloudflare D1 (SQLite at the edge) |
| **Cache / rate limiting** | Cloudflare KV |
| **AI — article synthesis** | Cloudflare Workers AI (Llama 3.3 70B), Google Gemini as fallback |
| **AI — comment moderation** | Anthropic Claude (Sonnet) |
| **Authentication** | Google OAuth 2.0 (Sign in with Google) |
| **Deployment** | Cloudflare Pages + Worker service binding |
| **Node.js** | Version 20 or higher required |

### Database Tables

| Table | Purpose |
|---|---|
| `users` | One row per Google account — email, name, birth date |
| `articles` | All debate articles (ingested and user-submitted) |
| `votes` | One vote per user per article (For / Against / Neutral) |
| `comments` | Threaded comments on articles |
| `comment_flags` | AI or editor flags on comments |
| `user_strikes` | Legacy strike records |
| `user_moderation_state` | Current penalty state per user (warnings, timeouts, bans) |
| `user_pardons` | Editor pardons |
| `moderation_violations` | Full audit log of every penalty applied |

### API Endpoints (summary)

All routes are prefixed with `/api`.

| Method | Path | Auth required | Purpose |
|---|---|---|---|
| GET | `/health` | No | Health check |
| POST | `/users` | No | Create or update user on sign-in |
| GET/POST | `/users/:sub/birthday` | No | Read or set date of birth |
| GET | `/users/me/moderation-state` | Bearer token | Current user’s moderation status |
| GET | `/articles` | No | Paginated public feed (verified, non-hidden only) |
| GET | `/articles/:id` | Optional | Single article (`?preview=1` for unverified) |
| POST | `/articles/:id/vote` | Bearer token | Record a stance vote |
| GET | `/articles/:id/votes` | No | Vote distribution for an article |
| POST | `/topics` | Bearer token | Submit a new topic |
| GET | `/topics/mine` | Bearer token | List user’s own submissions |
| GET | `/debates/:id/comments` | Optional Bearer | List comments |
| POST | `/debates/:id/comments` | Bearer token | Post a comment |
| DELETE | `/comments/:id` | Bearer token | Delete own comment |
| GET/PATCH | `/editor/articles` | **None** | Editor article queue |
| GET/POST | `/editor/comments/*` | **None** | Flagged comment moderation |
| GET/POST | `/editor/users/:id/*` | **None** | Strikes, violations, pardon |

**Authentication method:** Protected routes expect a Google ID token in the `Authorization: Bearer <token>` header. The server verifies the token against Google’s tokeninfo endpoint (audience and expiry checks).

There are **no session cookies** — the client holds the short-lived Google token and sends it with each request.

### External Integrations

| Service | Role in Polaris |
|---|---|
| **Google OAuth** | User sign-in; server-side token verification |
| **The Guardian Content API** | Scheduled news ingest + local article seeding |
| **Hacker News (Algolia API)** | Scheduled news ingest |
| **GDELT Project API** | Scheduled global news ingest |
| **Cloudflare Workers AI** | Rewrites raw news into structured debate articles |
| **Anthropic Claude** | Comment and topic moderation |
| **Google Gemini** | Optional fallback for article synthesis |
| **Cloudflare Email** | Optional ban notification emails (configured but not enabled by default) |

---

## 9. Data Flows & Key Workflows

### A. User Onboarding

1. User opens the app → **AuthGate** overlay blocks all content.
2. User clicks **Sign in with Google** → JWT decoded client-side → profile stored.
3. `POST /api/users` upserts the user record in the database.
4. User enters date of birth → `POST /api/users/:sub/birthday` → saved once, locked forever.
5. AuthGate closes; the user can browse.

### B. Loading the Feed

1. On startup, `FeedBootstrap` calls the articles API.
2. Server returns verified, non-hidden articles (paginated by publish date).
3. If the API is unavailable, the app falls back to a static `articles.json` file, then to built-in mock data.

### C. Commenting (full moderation path)

1. User submits a comment on a discussion page.
2. Server checks: Is the user banned or timed out? Has the rate limit (5 seconds) expired?
3. Comment is inserted as visible.
4. AI moderation bot evaluates the text asynchronously.
5. Based on the result:
   - **Allow** → no change.
   - **Flag** → comment hidden from other users; author sees “pending review”; flag record created for editor.
   - **Auto-delete** → comment removed; penalty applied; violation logged.
6. Editor can later review flagged comments and choose: delete, clear, or mark as false positive.

### D. Editorial Review

1. Editor navigates to `/manager` and enters the 4-digit PIN.
2. **Pending** tab shows unverified user submissions.
3. Editor reads the submission, optionally edits perspective text, then verifies or hides.
4. `PATCH /api/editor/articles/:id` sets `verified = 1`, records editor ID and timestamp.
5. Article appears in the public feed.

### E. Voting (current integration status)

The backend fully supports stance voting via `POST /api/articles/:id/vote`. However, the frontend **VoteWidget currently stores votes only in browser local storage** and does not yet call the API. The stance bar on discussion pages shows server-side distribution when available, or AI-estimated defaults from article metadata.

> **For IT students:** Wiring the VoteWidget to the vote API is an open integration task.

---

## 10. Security Considerations & Known Limitations

> **This section is essential reading for Safety & Security students** and useful for IT students implementing fixes.

Polaris is a **student project / demo environment**, not a production-hardened platform. The following are deliberate or known gaps:

### Authentication & Authorization Gaps

| Issue | Risk | What should happen in production |
|---|---|---|
| **Editor API has no server-side auth** | Anyone who knows the API URLs can verify, hide, or moderate content without the PIN | Editor routes should require a server-verified editor token or role |
| **Birthday endpoints are unauthenticated** | Anyone who knows a Google `sub` ID could read or set another user’s birthday | Birthday routes should require a valid Bearer token matching the `sub` |
| **User upsert is unauthenticated** | Arbitrary user records could be created with fake IDs | `POST /api/users` should verify the Google token |
| **CORS set to `*`** | Any website could call the API from a browser | Restrict to the production domain |
| **Editor PIN is client-side only** | PIN is hashed in localStorage but never checked by the server | Real role-based access control on the backend |

### What Works Well (security positives)

- Google ID tokens are verified server-side before protected actions (comment, vote, topic submit).
- Minimum age of 13 is enforced on date of birth.
- Date of birth is write-once per account.
- AI moderation defaults to **flag** (not allow) when uncertain.
- All penalties are logged in an audit table with timestamps and reasons.
- Comment rate limiting prevents spam (1 comment per 5 seconds per user).
- Flagged comments are hidden from the public immediately.
- Social bans are enforced server-side — banned users cannot comment even if they bypass the UI.

### Privacy Notes

- The Privacy Policy and Terms pages may still reference an older “local-only MVP” description. The live application stores data in Cloudflare D1. The About page reflects the current architecture.
- Google ID tokens are kept in client-side state (Zustand) for API calls. They expire naturally with Google’s token lifetime.

---

## 11. Project Structure

```
polaris/
├── src/                          # React frontend
│   ├── main.jsx                  # App entry point, Google OAuth provider
│   ├── App.jsx                   # Route definitions
│   ├── pages/                    # HomePage, ExplorePage, DiscussionPage,
│   │                             # ProfilePage, AboutPage, ManagerPage, etc.
│   ├── components/               # VoteWidget, CommentSection, AuthGate,
│   │   └── editor/               # ModerationPanel (editor dashboard)
│   ├── stores/                   # Zustand state: user, feed, theme
│   ├── services/                 # Legacy/dev integrations (GDELT, Reddit, etc.)
│   └── data/
│       ├── categories.js        # Submission categories (10 areas)
│       ├── exploreTopics.js     # Explore portal definitions
│       └── curatedDebates.js    # 50 curated controversial debates
│   ├── lib/weeklyDebate.js       # Weekly featured debate rotation
│
├── worker/                       # Cloudflare Worker backend
│   ├── src/index.ts              # Hono app, route mounting, cron handler
│   ├── src/routes/               # users, articles, topics, comments, editor, votes
│   ├── src/lib/                  # auth, moderationBot, moderationHelpers, synthesise
│   ├── src/jobs/ingest.ts        # Scheduled news ingest pipeline
│   ├── schema.sql                # Base database schema
│   ├── migrations/               # 001–005 (comments, moderation, categories, curated seed)
│   └── wrangler.toml             # Worker config: D1, KV, AI, cron
│
├── functions/api/[[path]].js     # Cloudflare Pages → Worker proxy
├── public/_redirects             # SPA fallback routing
├── wrangler.toml                 # Pages project + service binding
├── vite.config.js                # Dev server + API proxy
└── scripts/                      # Article seeding, Guardian fetch, bundle verify
```

---

## 12. Running the Project Locally

### Prerequisites

- Node.js 20 or higher
- A Google Cloud OAuth client ID (`VITE_GOOGLE_CLIENT_ID`)
- Wrangler CLI (included as a dev dependency)

### Frontend only

```bash
npm install
npm run dev
```

Opens the Vite dev server. API calls to `/api/*` are proxied to `http://127.0.0.1:8787`.

### Backend (Worker + D1 database)

```bash
npm run worker:dev
```

Starts the Cloudflare Worker locally with D1, KV, and AI bindings.

**Apply migrations (required for curated debate comments):**

```bash
npm run worker:db:migrate:all:local   # from worker/ — schema + curated seed
# or step by step:
cd worker && npm run db:migrate:all:local
```

**Regenerate curated SQL after editing debates:**

```bash
npm run seed-curated
cd worker && npm run db:migrate:curated:local
```

### Seed articles from The Guardian

```bash
npm run seed-articles
```

Fetches Guardian content and builds a static `articles.json` fallback file.

### Environment Variables

**Frontend (`.env`):**

| Variable | Required | Purpose |
|---|---|---|
| `VITE_GOOGLE_CLIENT_ID` | Yes | Google Sign-In |

**Worker secrets (`wrangler secret put`):**

| Secret | Required | Purpose |
|---|---|---|
| `GUARDIAN_API_KEY` | Yes (for ingest) | Guardian Content API |
| `GOOGLE_CLIENT_ID` | Yes | Server-side token verification |
| `ANTHROPIC_API_KEY` | Recommended | Comment/topic moderation |
| `GEMINI_API_KEY` | Optional | Synthesis fallback |

---

## 13. Deployment

Polaris runs on **Cloudflare** as two connected projects:

| Project | What it hosts |
|---|---|
| **Cloudflare Pages** (`polaris`) | Static React build (`dist/`) + Pages Function that proxies `/api/*` |
| **Cloudflare Worker** (`polaris-worker`) | Hono API, D1 database, KV, Workers AI, cron ingest job |

The Pages project connects to the Worker through a **service binding** defined in `wrangler.toml`.

**Build & deploy:**

```bash
npm run build          # Builds frontend to dist/
npm run worker:deploy  # Deploys the Worker
# Pages deploys automatically via Cloudflare Pages CI on push
```

**Database migrations:**

```bash
npm run worker:db:migrate
```

---

## 14. Collaboration Guide — Who Owns What

This section maps responsibilities so Safety & Security and IT students know where their work fits.

### Safety & Security Students — Your Domain

| Area | What to focus on | Key files / locations |
|---|---|---|
| **Curated debate library** | Which topics exist, weekly rotation policy, sensitive-topic handling | `src/data/curatedDebates.js`, `src/lib/weeklyDebate.js` |
| **Explore subject areas** | Portal labels, topic grouping, civic domain coverage | `src/data/exploreTopics.js`, `src/pages/ExplorePage.jsx` |
| **Moderation rules** | What the AI bot should flag, allow, or delete | `worker/src/lib/moderationBot.ts` |
| **Penalty ladder** | Warning → timeout → ban thresholds | `worker/src/lib/moderationHelpers.ts`, `worker/migrations/003_moderation_tiers.sql` |
| **Masking detection** | Bypass attempts (asterisk profanity) | `worker/src/lib/maskDetection.ts` |
| **Editor workflows** | How editors review articles and flagged comments | `src/pages/ManagerPage.jsx`, `src/components/editor/ModerationPanel.tsx` |
| **Age gating** | 13+ enforcement, write-once DOB | `src/components/AuthGate.jsx`, `worker/src/routes/users.ts` |
| **Audit & accountability** | Violation logging, pardons, ban emails | `moderation_violations` table, `worker/src/lib/moderationEmail.ts` |
| **Security review** | Known auth gaps, threat modelling | [Section 10](#10-security-considerations--known-limitations) |
| **Privacy & terms** | Accurate data handling descriptions | `src/pages/PrivacyPage.jsx`, `src/pages/TermsPage.jsx` |

**Questions Safety & Security students should be able to answer after reading this document:**

- What happens when a user posts a comment containing masked profanity?
- What is the difference between a timeout and a social ban?
- Why does the platform require editorial verification before publication?
- What are the known security weaknesses, and how would you fix them?

### IT Students — Your Domain

| Area | What to focus on | Key files / locations |
|---|---|---|
| **Frontend UI** | Pages, components, routing, state management | `src/pages/`, `src/components/`, `src/stores/` |
| **Curated debates data** | 50 debate definitions, article builder, topic mapping | `src/data/curatedDebates.js`, `scripts/generateCuratedSeed.mjs` |
| **Explore filtering** | Client-side topic merge and filter | `src/stores/feedStore.js`, `src/data/exploreTopics.js` |
| **API design** | REST endpoints, auth middleware, error handling | `worker/src/routes/`, `worker/src/lib/auth.ts` |
| **Database schema** | Tables, indexes, migrations | `worker/schema.sql`, `worker/migrations/` |
| **News ingest pipeline** | Scheduled fetch, dedup, AI synthesis | `worker/src/jobs/ingest.ts`, `worker/src/lib/synthesise.ts` |
| **AI integration** | Workers AI, Claude moderation, Gemini fallback | `worker/src/lib/moderationBot.ts`, `worker/src/lib/synthesise.ts` |
| **Authentication** | Google OAuth flow, token verification | `src/components/AuthGate.jsx`, `worker/src/lib/auth.ts` |
| **Deployment** | Cloudflare Pages + Worker, service bindings, cron | `wrangler.toml`, `worker/wrangler.toml`, `functions/api/` |
| **Open integrations** | Wire VoteWidget to vote API, server-side editor auth | `src/components/VoteWidget`, `worker/src/routes/votes.ts` |

**Questions IT students should be able to answer after reading this document:**

- How does a browser request reach the D1 database?
- What happens during the 6-hour cron ingest job?
- Which API routes require authentication and which do not?
- How would you add server-side authentication for the editor panel?

### Shared Responsibilities

Both groups should collaborate on:

- **End-to-end testing** of the moderation pipeline (post a comment → see it flagged → editor resolves it).
- **Topic submission flow** (submit → pending → editor verifies → appears in feed).
- **Documenting decisions** — when a moderation rule changes, update both the bot prompt and the About page guidelines.
- **Security hardening** — IT implements the fixes; Safety & Security defines the requirements.

---

## Quick Reference — Feature Integration Status

| Feature | Backend ready | Frontend wired |
|---|---|---|
| Feed / articles | Yes | Yes |
| 50 curated debates | Yes (seed migration) | Yes |
| Weekly featured debate | Yes (client rotation) | Yes |
| Explore subject areas | Yes (client filter) | Yes |
| Topic submission | Yes | Yes |
| Comments + moderation | Yes | Yes |
| Stance voting | Yes | **No** (local storage only) |
| Notifications | No (mock only) | Local mock |
| Editor panel | Yes | Yes (PIN client-side only) |

---

*This document reflects the codebase as of the current project state. For the latest user-facing guidelines, see the in-app About page. For legal details, see Terms and Privacy — note these may need updating to match the current server-backed architecture.*
