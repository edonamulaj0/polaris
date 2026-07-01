# Polaris — Platform Report

**Tagline:** *Your Anchor in Polarized Seas*

Polaris is a civic-intelligence platform that surfaces polarized debates across **technology, science, climate, human rights, immigration, politics, religion, education, and health**, explains what each side argues, and lets signed-in users register a stance, comment, and submit new topics — all under human editorial oversight and automated moderation.

The interface uses a **nautical-celestial** visual identity — calm, prestigious, and anchored around the North Star — with midnight navy, starlight silver, and warm gold accents.

This document explains **what** the application contains, **why** it is designed this way, and **how** it works end to end.

---

## Table of Contents

1. [The Problem Polaris Solves](#1-the-problem-polaris-solves)
2. [Who Uses the Platform](#2-who-uses-the-platform)
3. [What the Application Contains](#3-what-the-application-contains)
4. [Design & Interface](#4-design--interface)
5. [Explore, Curated Debates & Weekly Feature](#5-explore-curated-debates--weekly-feature)
6. [How a User Experiences Polaris](#6-how-a-user-experiences-polaris)
7. [How Content Gets Onto the Platform](#7-how-content-gets-onto-the-platform)
8. [Safety, Moderation & Community Rules](#8-safety-moderation--community-rules)
9. [How the System Is Built](#9-how-the-system-is-built)
10. [Data Flows & Key Workflows](#10-data-flows--key-workflows)
11. [Security Considerations & Known Limitations](#11-security-considerations--known-limitations)
12. [Project Structure](#12-project-structure)
13. [Running the Project Locally](#13-running-the-project-locally)
14. [Deployment](#14-deployment)

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

Polaris deliberately combines **automation** (AI synthesis and moderation) with **human judgment** (editorial review) because neither alone is sufficient for a trustworthy debate space. The platform is built to:

- Present **both sides** of real disagreements in structured, readable prose
- Enforce **community standards** through AI moderation, tiered penalties, and editor review
- Provide a **modern web application** — API-backed feed, authentication, cloud deployment, and real-time participation

---

## 2. Who Uses the Platform

There are three practical roles in the application. These are not formal database roles — they describe how different people interact with Polaris.

| Role | How they access the app | What they can do |
|---|---|---|
| **Visitor** | Opens the site without signing in | Blocked by the sign-in gate — cannot use the platform |
| **Member** | Google Sign-In + one-time date of birth (must be 13+) | Browse verified articles, vote on stances, comment, submit topics, view profile |
| **Editor** | Register via **Become an editor** at the bottom of your profile (`/profile/me`), then unlock `/manager` with a server-verified 4-digit PIN | Review pending articles, verify or hide content, moderate flagged comments, issue pardons, inspect user violation history |

> **Note:** The editor panel is **not** in the main navigation. Members opt in from their profile; all `/api/editor/*` routes require a valid Google Bearer token, an active editor session (`X-Editor-Session`), and a registered editor account in D1.

---

## 3. What the Application Contains

### Pages & Features

| Route | Page | Purpose |
|---|---|---|
| `/` | **Home** | “Today’s Debates” — main feed with sort controls and a trending strip |
| `/explore` | **Explore** | Browse nine subject areas, 50 curated debates, and the weekly featured controversy |
| `/discussion/:id` | **Discussion** | Full article with stance bar, voting widget, and comment section |
| `/profile/:username` | **Profile** | User activity — stances, comments, submitted topics (`/profile/me` = your own profile) |
| `/about` | **About** | Full platform report (mirrors this README’s user-facing sections) at wide layout |
| `/terms` | **Terms of Service** | Legal terms |
| `/privacy` | **Privacy Policy** | Data handling information |
| `/manager` | **Editor Panel** | Article queue + moderation dashboard (profile registration + server PIN session) |

### Named Features

- **Daily Intelligence Brief** — header on the home feed
- **Weekly Controversial Debate** — one featured curated topic rotates each calendar week (Home + Explore)
- **Curated Debates** — 50 pre-built controversial topics (death penalty, euthanasia, social media, education, etc.)
- **Explore subject areas** — nine portals: Technology, Science, Climate Change, Human Rights, Immigration, Politics, Religion & Ethics, Education, Health & Society
- **Submit Topic** — gold pill button in the header; opens modal for proposing a new debate
- **Become an editor** — link at the bottom of your profile; registers a server-stored PIN and unlocks `/manager` (PIN can be reset from profile while signed in)
- **Editor Panel** — at `/manager` only (not in header nav); requires Google sign-in + editor registration + PIN unlock each session
- **Verified badge** — shown on editor-approved articles
- **Civility score** — 0–100 indicator on each discussion
- **Stance bar** — full-width inset slot with teal→amber gradient showing For / Against / Neutral distribution
- **Vote widget** — pill-shaped buttons to register Pro, Against, or Neutral (saved to D1 via API)
- **Save & subscribe** — heart saves a debate; bell subscribes to in-app notifications for new comments
- **Notification bell (header)** — in-app feed for replies, moderation, topic decisions, and subscribed debates
- **Comment section** — threaded comments with AI moderation; **Enter** to post, **Shift+Enter** for new line
- **Trending strip / panel** — highlights active discussions (strip on mobile home; panel in right column on desktop)
- **Feed sort controls** — Relevance, Most recent, Most popular (pill-shaped filter tabs)
- **Theme toggle** — **dark / light only** (no system theme option)
- **Auth gate** — Google Sign-In + date-of-birth screen shown before the app is usable
- **Editor Panel tabs** — Pending / Verified / All articles, plus a **Moderation Panel** for flagged comments

### Navigation & layout

Polaris uses a **single top header bar** — there is **no sidebar**.

| Area | Contents |
|---|---|
| **Header left** | Compass-rose-star logo, **Polaris** wordmark, tagline *Your Anchor in Polarized Seas* (desktop) |
| **Header center** | Pill-shaped nav links: Home, Explore, Profile, About |
| **Header right** | Date, **Submit Topic** button, theme toggle, notifications |
| **Mobile** | Compact logo, header actions, bottom nav (Home / Explore / Profile / About), hamburger menu for Terms & Privacy |

**Content width:** Home and About use a wide `max-w-6xl` main column; discussion pages use `max-w-5xl`. Opening any route scrolls to the **top of the page** automatically.

**Key UI files:** `src/components/AppNavbar.jsx`, `src/layout/AppLayout.jsx`, `src/index.css`, `src/components/LogoMark.jsx`

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

## 4. Design & Interface

> How the app looks, feels, and behaves in the browser.

Polaris uses a **calming, prestigious, nautical-celestial** theme centered on the North Star. The goal is editorial credibility: debate without outrage-bait styling.

### Color palette

| Token | Dark mode | Light mode | Usage |
|---|---|---|---|
| Background | `#0A1128` midnight navy | `#F8FAFC` silver-white | Page background |
| Surface | `#162040` / `#1C2848` | `#FFFFFF` / `#F1F5F9` | Cards, panels |
| Text | `#E2E8F0` starlight silver | `#0F172A` deep navy | Headings, body |
| Accent | `#F4D068` warm gold | `#F4D068` warm gold | CTAs, active nav, verified badges |
| Stance spectrum | `#0D7377` teal → `#D97706` amber | same | Stance bar gradient |

Dark mode adds soft **celestial radial gradients** and a subtle **star-field texture** on the page background (`src/index.css`).

### Typography

| Role | Font | Usage |
|---|---|---|
| Headings & display | **Cormorant Garamond** | “Today’s Debates”, article titles, logo wordmark |
| Body & UI | **Inter** | Navigation, buttons, metadata, forms |
| Tagline | Cormorant Garamond *italic* | *Your Anchor in Polarized Seas* beneath the logo |

Fonts are loaded in `index.html` via Google Fonts.

### Logo

The **LogoMark** (`src/components/LogoMark.jsx`) is a golden-white **compass-rose-star** SVG emblem beside the wordmark. Gradient IDs use React `useId()` so the logo renders correctly in both themes when multiple instances appear on screen.

### Elevation & shape (strict rules)

- **No solid borders** on cards, buttons, or layout containers — depth comes from **soft, multi-layer ambient box-shadows**
- **Pill-shaped geometry** on nav links, filter tabs, buttons, tags, inputs, and cards (`border-radius: 9999px` / `rounded-3xl`)
- CSS utilities: `.elevated`, `.nav-pill`, `.nav-pill-active`, `.stance-slot`, `.spectrum-track` in `src/index.css`

### Stance bar

The stance bar (`src/components/StanceBar.jsx`) shows community distribution (For / Against / Neutral):

1. A **full-width inset “slot”** (`.stance-slot`) — muted track with inset shadow, always spanning 100% of the card width
2. A **teal → amber gradient fill** inside the slot
3. Hover tooltips with percentage (and approximate comment counts when available)

### Theme switching

- Toggle in the header cycles **dark ↔ light** only
- State persisted in Zustand (`src/stores/themeStore.js`) under `polaris-theme-v1`
- Legacy `system` preference migrates to **dark** on load
- `data-theme` attribute on `<html>` drives CSS custom properties

### Responsive behaviour

| Breakpoint | Behaviour |
|---|---|
| **Mobile** | Bottom nav, hamburger menu, compact header logo, trending strip on home |
| **Desktop (lg+)** | Full header nav pills, trending panel in right column |
| **Explore / About** | Trending panel hidden to give the main column more width |

---

## 5. Explore, Curated Debates & Weekly Feature

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

**Why these areas exist:** Real civic disagreement spans science and tech *and* rights, ethics, politics, and social policy. Grouping debates by subject area helps users browse by domain and lets the app filter content client-side using each debate’s `topicArea` metadata.

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

- **Why:** Gives the community a shared focal point without manual curation every week.
- **How:** `src/lib/weeklyDebate.js` computes `(weekNumber - 1) % 50` and returns the matching debate. The same moderation rules apply to all featured topics, including sensitive political and religious subjects.

---

## 6. How a User Experiences Polaris

This is the step-by-step journey a member goes through:

```
Sign in with Google
        ↓
Enter date of birth (once, ages 13–120)
        ↓
Browse Home or Explore by category
        ↓
Open a discussion → read all sections (page opens at top)
        ↓
Register stance (For / Against / Neutral)
        ↓
Leave a comment — Enter to post, Shift+Enter for new line (AI moderation)
        ↓
Optionally submit a new topic via header button (AI-moderated, then waits for editor)
        ↓
Track activity on profile page
        ↓
Optionally save (heart) or subscribe (bell) to debates for notifications
```

### Why each step exists

| Step | Why |
|---|---|
| **Google Sign-In** | Provides a real identity anchor without building a custom password system |
| **Date of birth** | Age gate — platform is not intended for children under 13 |
| **Structured articles** | Reduces drive-by outrage; readers must engage with both sides before commenting |
| **Scroll to top on navigation** | Opening a discussion always starts at the article header, not mid-page |
| **Stance voting** | Makes disagreement visible and measurable without requiring a comment |
| **Comment keyboard** | Enter submits; Shift+Enter adds a line break — familiar chat-style UX |
| **AI moderation on comments** | First line of defence before a human editor sees flagged content |
| **Editorial review on submissions** | Prevents low-quality or biased topic proposals from entering the public feed |

---

## 7. How Content Gets Onto the Platform

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

1. A signed-in member clicks **Submit Topic** in the header and provides a title, category, their own stance, and a neutral description.
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
4. **`ensureDebateExists`** (`worker/src/lib/ensureCuratedArticle.ts`) also auto-provisions **stub article rows** for any feed debate ID (ingested news, etc.) so comments work without a manual seed per article.
5. One topic is highlighted each week as the **Weekly Controversial Debate**.

**Why:** Provides ready-made, diverse debate material spanning politics, religion, ethics, and social policy without waiting for news ingest or editor approval.

---

## 8. Safety, Moderation & Community Rules

### Community Guidelines

Polaris is built for **constructive disagreement**. The rules on the in-app **About** page (which mirrors Sections 1–8 of this document) boil down to:

1. **Argue ideas, not people** — no harassment, hate speech, slurs, threats, or doxxing.
2. **Cite sources for factual claims** — no deliberate misinformation.
3. **Good-faith disagreement only** — no sealioning, brigading, or coordinated disruption.
4. **Quality topic submissions** — clear framing, neutral description, correct category.
5. **Respect editorial decisions** — editors may reject, hide, or request changes.

Categories span technology through civic and social domains (see [Section 5](#5-explore-curated-debates--weekly-feature)). **All comments on curated debates — including sensitive political and religious topics — pass through the same AI moderation and tiered penalty system.** The moderation bot applies particular scrutiny to irony, borderline content, and masking on high-emotion topics.

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
| Google account ID, email, name | Theme preference (`polaris-theme-v1`) |
| Date of birth (write-once) | Short-lived Google ID token (Zustand) |
| Votes, comments, moderation state | Editor session token (`sessionStorage`, 8 h) |
| Saved debates, debate comment subscriptions | Device-local account cache (migration fallback only) |
| Activity feed, notifications | |
| Articles, flags, violation audit log | |
| Editor registration (PIN hash, never plaintext) | |

---

## 9. How the System Is Built

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
| **Design system** | CSS custom properties in `src/index.css`; Cormorant Garamond + Inter; nautical-celestial palette |
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
| `users` | Google accounts — email, name, birth date, editor flags |
| `articles` | All debate articles (ingested and user-submitted) |
| `votes` | One vote per user per article (For / Against / Neutral) |
| `comments` | Threaded comments on articles |
| `comment_flags` | AI or editor flags on comments |
| `user_strikes` | Legacy strike records |
| `user_moderation_state` | Current penalty state per user (warnings, timeouts, bans) |
| `user_pardons` | Editor pardons |
| `moderation_violations` | Full audit log of every penalty applied |
| `user_saved_debates` | Hearted / saved debates per user |
| `user_activity` | Activity feed entries per user |
| `notifications` | In-app notifications (moderation, replies, topics, subscriptions) |
| `debate_subscriptions` | Users subscribed to new-comment alerts on a debate |

### API Endpoints (summary)

All routes are prefixed with `/api`.

| Method | Path | Auth required | Purpose |
|---|---|---|---|
| GET | `/health` | No | Health check |
| POST | `/users` | Bearer token | Upsert user on sign-in (identity from token) |
| GET/POST | `/users/me/birthday` | Bearer token | Read or set date of birth (write-once) |
| GET/POST | `/users/:sub/birthday` | Bearer (must match `sub`) | Legacy birthday routes |
| GET | `/users/me/moderation-state` | Bearer token | Current user’s moderation status |
| GET | `/users/me/profile` | Bearer token | Profile stats and recent activity |
| GET | `/users/me/activity-data` | Bearer token | Saved debates, subscriptions, stances, feed |
| POST | `/users/me/sync` | Bearer token | One-time merge of device-local activity |
| POST/DELETE | `/users/me/saved/:id` | Bearer token | Save or unsave a debate (heart) |
| POST/DELETE | `/users/me/subscriptions/:id` | Bearer token | Subscribe or unsubscribe to new-comment alerts |
| GET | `/users/me/notifications` | Bearer token | In-app notification feed |
| POST | `/users/me/notifications/read-all` | Bearer token | Mark all notifications read |
| POST | `/users/me/notifications/:id/read` | Bearer token | Mark one notification read |
| GET | `/users/me/editor-status` | Bearer token | Whether user is registered as editor |
| POST | `/users/me/editor/register` | Bearer token | Register editor PIN |
| POST | `/users/me/editor/unlock` | Bearer token | Unlock editor session with PIN |
| POST | `/users/me/editor/reset-pin` | Bearer token | Reset editor PIN (signed-in editor) |
| GET | `/articles` | No | Paginated public feed (verified, non-hidden only) |
| GET | `/articles/:id` | Optional | Single article (`?preview=1` for unverified) |
| POST | `/articles/:id/vote` | Bearer token | Record a stance vote |
| GET | `/articles/:id/votes` | Optional Bearer | Vote distribution; includes `userStance` when authenticated |
| POST | `/topics` | Bearer token | Submit a new topic |
| GET | `/topics/mine` | Bearer token | List user’s own submissions |
| GET | `/debates/:id/comments` | Optional Bearer | List comments |
| POST | `/debates/:id/comments` | Bearer token | Post a comment |
| DELETE | `/comments/:id` | Bearer token | Delete own comment |
| GET/PATCH | `/editor/articles` | Bearer + `X-Editor-Session` | Editor article queue |
| GET/POST | `/editor/comments/*` | Bearer + `X-Editor-Session` | Flagged comment moderation |
| GET/POST | `/editor/users/:id/*` | Bearer + `X-Editor-Session` | Strikes, violations, pardon |

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

## 10. Data Flows & Key Workflows

### A. User Onboarding

1. User opens the app → **AuthGate** overlay blocks all content.
2. User clicks **Sign in with Google** → JWT decoded client-side → profile stored.
3. `POST /api/users` upserts the user record in the database (requires verified Google Bearer token).
4. User enters date of birth → `POST /api/users/me/birthday` → saved once, locked forever.
5. AuthGate closes; the user can browse.

### B. Loading the Feed

1. On startup, `FeedBootstrap` calls the articles API.
2. Server returns verified, non-hidden articles (paginated by publish date).
3. If the API is unavailable, the app falls back to a static `articles.json` file, then to built-in mock data.

### C. Commenting (full moderation path)

1. User submits a comment on a discussion page (**Enter** to post; **Shift+Enter** for a new line).
2. Client sends `POST /api/debates/:id/comments` with Bearer token; responses are always parsed as JSON (non-JSON errors surface a readable message).
3. Server checks: Is the user banned or timed out? Has the rate limit (5 seconds) expired? Does the debate exist in D1 (`ensureDebateExists` creates a stub if needed)?
4. Comment is inserted as visible.
5. AI moderation bot evaluates the text.
6. Based on the result:
   - **Allow** → no change.
   - **Flag** → comment hidden from other users; author sees “pending review”; flag record created for editor.
   - **Auto-delete** → comment removed; penalty applied; violation logged.
7. Editor can later review flagged comments and choose: delete, clear, or mark as false positive.

Comment GET/POST routes wrap errors in JSON `{ error, message }` rather than returning plain-text 500 responses.

### D. Editorial Review

1. Member scrolls to the bottom of **Profile** (`/profile/me`) and clicks **Become an editor** to register a 4-digit PIN (stored as a hash on the server).
2. Member opens `/manager` (via **Open editor panel** on the profile, or by URL) and enters the PIN → server returns an 8-hour editor session token (`sessionStorage`).
3. **Pending** tab shows unverified user submissions.
4. Editor reads the submission, optionally edits perspective text, then verifies or hides.
5. Authenticated requests to `PATCH /api/editor/articles/:id` (Bearer + `X-Editor-Session`) set `verified = 1`, record editor ID and timestamp.
6. Article appears in the public feed.

### E. Voting

1. Signed-in member selects **Pro**, **Against**, or **Neutral** on a discussion page.
2. Client sends `POST /api/articles/:id/vote` with Bearer token.
3. Server upserts the vote, recalculates stance distribution, and returns updated percentages.
4. The stance bar and VoteWidget refresh from the API; distribution is also synced into the feed store.

### F. Notifications

Server-backed notifications are stored in D1 and fetched via `GET /api/users/me/notifications`. Events that create notifications include:

- Reply to your comment
- Comment flagged, removed, or cleared by moderation
- Topic submission approved or hidden by an editor
- **New comment** on a debate you subscribed to (bell icon on cards / discussion page)

The header bell polls every 60 seconds while signed in and refreshes when the panel opens.

### G. Comment subscriptions

1. Signed-in member taps the **bell** next to the heart on a feed card or discussion page.
2. `POST /api/users/me/subscriptions/:id` stores the subscription in D1.
3. When another user posts a **visible** comment on that debate, all subscribers (except the commenter) receive an in-app notification.
4. Tap the bell again to unsubscribe (`DELETE`).

---

## 11. Security Considerations & Known Limitations

Polaris has production-oriented auth for user identity, birthdays, and editor access. Remaining gaps are called out below.

### Authentication & Authorization (implemented)

| Area | Protection |
|---|---|
| **Editor API** | All `/api/editor/*` routes require Google Bearer token + `X-Editor-Session` header + `is_editor = 1` in D1 |
| **Editor registration** | `POST /api/users/me/editor/register` — PIN hashed server-side; issues session token |
| **Editor unlock** | `POST /api/users/me/editor/unlock` — verifies PIN, returns HMAC session (8 h TTL) |
| **Editor PIN reset** | `POST /api/users/me/editor/reset-pin` — new PIN while signed in as editor |
| **Birthday** | `GET/POST /api/users/me/birthday` require Bearer token; legacy `/:sub/birthday` routes require token matching `sub` |
| **User upsert** | `POST /api/users` verifies Google ID token; identity taken from token, not request body |
| **CORS** | Restricted to `https://polaris-a4m.pages.dev` and local dev origins (`localhost:5173`); optional `ALLOWED_ORIGINS` env var |

**Production secret:** set `EDITOR_SESSION_SECRET` on the Worker (`npx wrangler secret put EDITOR_SESSION_SECRET` from `worker/`). Used for PIN hashing and editor session HMACs.

**Editor UX:** the panel is intentionally hidden from main nav. Users register via **Become an editor** at the bottom of their profile page.

### Remaining limitations

- **Push notifications** — in-app notifications are server-backed, but there is no browser or mobile push delivery yet.
- **Editor PIN recovery** — reset from profile while signed in; no email-based recovery flow.

### What works well (security positives)

- Google ID tokens are verified server-side before protected actions (comment, vote, topic submit).
- Minimum age of 13 is enforced on date of birth.
- Date of birth is write-once per account.
- AI moderation defaults to **flag** (not allow) when uncertain.
- All penalties are logged in an audit table with timestamps and reasons.
- Comment rate limiting prevents spam (1 comment per 5 seconds per user).
- Flagged comments are hidden from the public immediately.
- Social bans are enforced server-side — banned users cannot comment even if they bypass the UI.

### Privacy Notes

- The Privacy Policy and Terms pages describe the current Cloudflare D1–backed architecture. The in-app **About** page mirrors the user-facing sections of this README.
- Google ID tokens are kept in client-side state (Zustand) for API calls. They expire naturally with Google’s token lifetime.

---

## 12. Project Structure

```
polaris/
├── src/                          # React frontend
│   ├── main.jsx                  # App entry point, Google OAuth provider
│   ├── App.jsx                   # Route definitions
│   ├── index.css                 # Design tokens, theme, elevation utilities
│   ├── pages/                    # HomePage, ExplorePage, DiscussionPage,
│   │                             # ProfilePage, AboutPage, ManagerPage, etc.
│   ├── layout/
│   │   └── AppLayout.jsx         # Top header, main column widths, scroll-to-top
│   ├── components/               # AppNavbar, VoteWidget, DebateSaveSubscribe, CommentSection,
│   │                             # AuthGate, LogoMark, StanceBar, DiscussionCard, etc.
│   │   └── editor/               # ModerationPanel (editor dashboard)
│   ├── stores/                   # Zustand state: user, feed, theme, notifications
│   ├── services/                 # voteApi, userActivityApi; legacy/dev integrations
│   └── data/
│       ├── categories.js         # Submission categories (10 areas)
│       ├── exploreTopics.js      # Explore portal definitions
│       └── curatedDebates.js     # 50 curated controversial debates
│   ├── lib/                      # editorApi, weeklyDebate, accountActivity, etc.
│
├── worker/                       # Cloudflare Worker backend
│   ├── src/index.ts              # Hono app, route mounting, CORS, cron handler
│   ├── src/routes/               # users, articles, topics, comments, editor, votes
│   ├── src/lib/                  # auth, moderationBot, notifications, debateSubscriptions
│   │   └── ensureCuratedArticle.ts  # Curated seed + stub articles for comments
│   ├── src/jobs/ingest.ts        # Scheduled news ingest pipeline
│   ├── schema.sql                # Base database schema
│   ├── migrations/               # 001–009 (comments, moderation, editor auth, notifications, subscriptions)
│   └── wrangler.toml             # Worker config: D1, KV, AI, cron
│
├── functions/api/[[path]].js     # Cloudflare Pages → Worker proxy
├── public/_redirects             # SPA fallback routing
├── wrangler.toml                 # Pages project + service binding
├── vite.config.js                # Dev server + API proxy
└── scripts/                      # Article seeding, Guardian fetch, bundle verify
```

---

## 13. Running the Project Locally

### Prerequisites

- Node.js 20 or higher
- A Google Cloud OAuth client ID (`VITE_GOOGLE_CLIENT_ID`)
- Wrangler CLI (included as a dev dependency)

### Frontend only

```bash
npm install
npm run dev
```

Opens the Vite dev server. API calls to `/api/*` are proxied to `http://127.0.0.1:8787`. **Comments require the worker** — if the worker is not running, the API returns errors instead of JSON.

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
cd worker && npm run db:migrate:editor:local   # editor registration columns
cd worker && npm run db:migrate:notifications:local
cd worker && npm run db:migrate:subscriptions:local
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
| `EDITOR_SESSION_SECRET` | Yes (production) | Editor PIN hashing and session HMACs |

---

## 14. Deployment

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
cd worker && npm run db:migrate:editor   # after deploy — editor auth columns
cd worker && npm run db:migrate:notifications
cd worker && npm run db:migrate:subscriptions
```

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
| Stance voting | Yes | Yes |
| Notifications | Yes (D1) | Yes (in-app feed) |
| Comment subscriptions | Yes (D1) | Yes (bell on cards) |
| Editor panel | Yes | Yes (server PIN + session) |

---

*This document reflects the codebase as of the current project state. For the latest user-facing summary, see the in-app About page. For legal details, see Terms and Privacy.*

---

## Links

| | URL |
|---|---|
| **Live app** | [https://polaris-a4m.pages.dev/](https://polaris-a4m.pages.dev/) |
| **GitHub repository** | [https://github.com/edonamulaj0/polaris](https://github.com/edonamulaj0/polaris) |
