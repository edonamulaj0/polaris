/**
 * Daily (or manual) job: Reddit → comments → Claude → public/discussions.json
 *
 * Run: ANTHROPIC_API_KEY=sk-ant-... npm run fetch-discussions
 * Dry: ANTHROPIC_API_KEY=sk-ant-... npm run fetch-discussions -- --dry-run
 *
 * Schedule via cron, GitHub Actions, or Cloudflare Workers `scheduled()`.
 */

import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const SUBREDDITS = ['worldnews', 'politics', 'technology', 'science', 'philosophy']

const USER_AGENT = 'nexus-curator/1.0 (batch script; contact: local)'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

/** [REFACTOR 3.3] Cap output size so discussions.json does not grow unbounded */
const MAX_POSTS = 20

/** [REFACTOR 3.3] Print JSON to stdout instead of writing to disk (CI validation) */
const DRY_RUN = process.argv.includes('--dry-run')

type RedditListing = {
  data?: { children?: { kind: string; data: Record<string, unknown> }[] }
}

type RedditPost = {
  id: string
  title: string
  subreddit: string
  score: number
  num_comments: number
  url: string
  thumbnail: string | null
  created_utc: number
  permalink?: string
  preview?: { images?: { source?: { url?: string } }[] }
  url_overridden_by_dest?: string
}

type Analysis = {
  for: string[]
  against: string[]
  common_ground: string
  civility_score: number
  stance_distribution: { for: number; against: number; neutral: number }
  category: string
}

type CuratedDiscussion = {
  id: string
  source: 'curated'
  redditId: string
  subreddit: string
  category: string
  title: string
  url: string
  score: number
  num_comments: number
  thumbnail: string | null
  imageUrl: string
  createdUtc: number
  stanceDistribution: { for: number; against: number; neutral: number }
  civility: number
  bothSides: {
    for: string[]
    against: string[]
    common_ground: string
    stance_distribution: { for: number; against: number; neutral: number }
  }
  sources: { type: string; title: string; url: string; domain: string }[]
  redditComments: string[]
  tweets: unknown[]
  fetchedAt: string
}

async function fetchRedditPosts(): Promise<RedditPost[]> {
  const posts: RedditPost[] = []

  for (const sub of SUBREDDITS) {
    const res = await fetch(
      `https://www.reddit.com/r/${sub}/controversial.json?limit=3&t=day`,
      { headers: { 'User-Agent': USER_AGENT } },
    )
    if (!res.ok) {
      console.warn(`Reddit ${sub}: HTTP ${res.status}`)
      continue
    }
    const data = (await res.json()) as RedditListing
    const children = data?.data?.children ?? []
    for (const child of children) {
      if (child.kind !== 't3') continue
      const p = child.data as unknown as RedditPost
      if (!p?.id || !p.title) continue
      posts.push({
        id: p.id,
        title: p.title,
        subreddit: p.subreddit || sub,
        score: Number(p.score ?? 0),
        num_comments: Number(p.num_comments ?? 0),
        url: String(p.url ?? ''),
        thumbnail:
          typeof p.thumbnail === 'string' && p.thumbnail.startsWith('http')
            ? p.thumbnail
            : null,
        created_utc: Number(p.created_utc ?? 0),
        permalink: typeof p.permalink === 'string' ? p.permalink : undefined,
        preview: p.preview,
        url_overridden_by_dest:
          typeof p.url_overridden_by_dest === 'string' ? p.url_overridden_by_dest : undefined,
      })
    }
    await sleep(800)
  }

  return posts
}

async function fetchComments(subreddit: string, postId: string): Promise<string[]> {
  const res = await fetch(
    `https://www.reddit.com/r/${subreddit}/comments/${postId}.json?limit=25&sort=top`,
    { headers: { 'User-Agent': USER_AGENT } },
  )
  if (!res.ok) throw new Error(`comments HTTP ${res.status}`)
  const data = (await res.json()) as RedditListing[]
  const listing = data?.[1]?.data?.children ?? []
  return listing
    .filter((c) => c.kind === 't1')
    .map((c) => (c.data as { body?: string }).body)
    .filter(
      (body): body is string =>
        Boolean(body && body !== '[deleted]' && body !== '[removed]' && body.length > 20),
    )
    .slice(0, 20)
}

function parseClaudeJson(text: string): Analysis {
  let raw = text.trim()
  const fence = raw.match(/^```(?:json)?\s*([\s\S]*?)```$/m)
  if (fence) raw = fence[1].trim()
  const obj = JSON.parse(raw) as Analysis
  if (!obj.for || !obj.against) throw new Error('Invalid analysis shape')
  return obj
}

async function analyzeDiscussion(title: string, comments: string[]): Promise<Analysis> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set')
  }

  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1200,
    messages: [
      {
        role: 'user',
        content: `You are an impartial analyst. Given this Reddit discussion titled "${title.replace(/"/g, '\\"')}" and these comments:

${comments.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Return ONLY valid JSON, no markdown, no explanation:
{
  "for": ["argument 1", "argument 2", "argument 3"],
  "against": ["argument 1", "argument 2", "argument 3"],
  "common_ground": "one sentence of shared concern",
  "civility_score": <integer 0-100>,
  "stance_distribution": { "for": <int%>, "against": <int%>, "neutral": <int%> },
  "category": "<one of: Politics | Tech | Society | Science | Culture>"
}`,
      },
    ],
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Anthropic ${res.status}: ${errText.slice(0, 400)}`)
  }

  const data = (await res.json()) as {
    content?: { type: string; text?: string }[]
  }
  const text = data?.content?.[0]?.text?.trim()
  if (!text) throw new Error('Empty Claude response')
  return parseClaudeJson(text)
}

function imageUrlFor(post: RedditPost): string {
  const u =
    post.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, '&') ||
    post.url_overridden_by_dest ||
    post.thumbnail
  if (u && u.startsWith('http')) return u
  return `https://picsum.photos/seed/reddit-${post.id}/960/520`
}

function normalizeCategory(c: string | undefined): string {
  const allowed = ['Politics', 'Tech', 'Society', 'Science', 'Culture']
  if (c && allowed.includes(c)) return c
  return 'Society'
}

function toCuratedRow(post: RedditPost, analysis: Analysis, fetchedAt: string): CuratedDiscussion {
  const permalink = post.permalink ?? `/r/${post.subreddit}/comments/${post.id}/`
  const redditUrl = permalink.startsWith('http') ? permalink : `https://www.reddit.com${permalink}`

  return {
    id: `reddit-${post.id}`,
    source: 'curated',
    redditId: post.id,
    subreddit: `r/${post.subreddit}`,
    category: normalizeCategory(analysis.category),
    title: post.title,
    url: redditUrl,
    score: post.score,
    num_comments: post.num_comments,
    thumbnail: post.thumbnail,
    imageUrl: imageUrlFor(post),
    createdUtc: post.created_utc,
    stanceDistribution: {
      for: analysis.stance_distribution.for,
      against: analysis.stance_distribution.against,
      neutral: analysis.stance_distribution.neutral,
    },
    civility: analysis.civility_score,
    bothSides: {
      for: analysis.for,
      against: analysis.against,
      common_ground: analysis.common_ground,
      stance_distribution: analysis.stance_distribution,
    },
    sources: [
      {
        type: 'reddit',
        title: post.title,
        url: redditUrl,
        domain: 'reddit.com',
      },
    ],
    redditComments: [],
    tweets: [],
    fetchedAt,
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function run(): Promise<void> {
  if (!ANTHROPIC_API_KEY) {
    console.error('Missing ANTHROPIC_API_KEY (use a server-side secret, not VITE_).')
    process.exit(1)
  }

  console.log('Fetching Reddit controversial posts…')
  const posts = await fetchRedditPosts()
  console.log(`Found ${posts.length} posts across subs.`)

  const discussions: CuratedDiscussion[] = []
  const fetchedAt = new Date().toISOString()

  for (const post of posts) {
    if (discussions.length >= MAX_POSTS) {
      console.log(`Reached MAX_POSTS (${MAX_POSTS}), stopping.`)
      break
    }

    try {
      console.log(`→ ${post.subreddit}/${post.id}: ${post.title.slice(0, 70)}…`)
      const comments = await fetchComments(post.subreddit, post.id)
      if (comments.length < 5) {
        console.log('  skip: not enough comments')
        await sleep(1200)
        continue
      }

      const analysis = await analyzeDiscussion(post.title, comments)
      discussions.push(toCuratedRow(post, analysis, fetchedAt))
      await sleep(1500)
    } catch (err) {
      console.error(`  failed ${post.id}:`, err)
    }
    await sleep(800)
  }

  const output = discussions.slice(0, MAX_POSTS)
  const json = JSON.stringify(output, null, 2)

  if (DRY_RUN) {
    console.error(`Dry run — ${output.length} rows (not written to disk).`)
    process.stdout.write(json + '\n')
    return
  }

  const outPath = join(__dirname, '../public/discussions.json')
  try {
    await writeFile(outPath, json, 'utf8')
  } catch (err) {
    console.error(`Failed to write ${outPath}:`, err)
    process.exit(1)
  }
  console.log(`Done. Wrote ${output.length} rows to ${outPath}`)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
