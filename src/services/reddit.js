import { guessCategory } from './categorise'

const SUBS = ['worldnews', 'politics', 'technology', 'science', 'AskReddit']

function redditOrigin() {
  return import.meta.env.DEV ? '/reddit' : 'https://www.reddit.com'
}

export async function fetchSubredditHot(subreddit, { limit = 10, after = null } = {}) {
  const base = redditOrigin()
  let url = `${base}/r/${subreddit}/hot.json?limit=${limit}&raw_json=1`
  if (after) url += `&after=${encodeURIComponent(after)}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Reddit ${subreddit}: ${res.status}`)
  const json = await res.json()
  const children = json?.data?.children ?? []
  const next = json?.data?.after ?? null
  return { children, after: next }
}

export async function fetchInitialMultiSub({ perSub = 5 } = {}) {
  const results = await Promise.all(
    SUBS.map(async (sub) => {
      try {
        const { children } = await fetchSubredditHot(sub, { limit: perSub })
        return children.map((ch) => normalizePost(ch, sub))
      } catch {
        return []
      }
    }),
  )
  const flat = results.flat()
  const seen = new Set()
  const uniq = []
  for (const p of flat) {
    if (!p || seen.has(p.id)) continue
    seen.add(p.id)
    uniq.push(p)
  }
  uniq.sort((a, b) => (b.score || 0) - (a.score || 0))
  return uniq
}

export async function fetchPostComments(subreddit, postId) {
  const base = redditOrigin()
  const url = `${base}/r/${subreddit}/comments/${postId}.json?limit=30&sort=top&raw_json=1`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error('comments')
  const json = await res.json()
  const listing = json?.[1]?.data?.children ?? []
  return listing
    .filter((c) => c.kind === 't1' && c.data?.body && !c.data.stickied)
    .map((c) => ({
      id: c.data.id,
      body: c.data.body,
      score: c.data.score,
      author: c.data.author,
    }))
}

export function normalizePost(child, subreddit) {
  const p = child.data
  if (!p || p.stickied) return null
  const id = `reddit-${p.id}`
  const thumb = p.thumbnail && p.thumbnail.startsWith('http') ? p.thumbnail : null
  const imageUrl =
    p.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, '&') ||
    p.url_overridden_by_dest ||
    thumb ||
    `https://picsum.photos/seed/${p.id}/960/520`

  return {
    id,
    redditId: p.id,
    source: 'reddit',
    subreddit: `r/${p.subreddit || subreddit}`,
    category: guessCategory(p.subreddit || subreddit),
    title: p.title,
    url: `https://reddit.com${p.permalink}`,
    score: p.ups ?? p.score ?? 0,
    num_comments: p.num_comments ?? 0,
    thumbnail: thumb,
    imageUrl,
    createdUtc: p.created_utc,
    stanceDistribution: { for: 34, against: 33, neutral: 33 },
    civility: 75,
    bothSides: null,
    sources: [
      {
        type: 'reddit',
        title: p.title,
        url: `https://reddit.com${p.permalink}`,
        domain: 'reddit.com',
      },
    ],
    redditComments: [],
    tweets: [],
  }
}

export { SUBS }
