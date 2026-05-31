// GDELT is free and CORS-friendly from browsers.
// We fetch its public GKG RSS/JSON endpoint filtered to tech & science.

import { guessCategory } from './categorise'

const GDELT_BASE = 'https://api.gdeltproject.org/api/v2/doc/doc'

/**
 * Returns up to `limit` articles about tech or science with controversy markers.
 * Falls back to empty array on CORS or network error.
 */
export async function fetchGdeltTopics({ limit = 20 } = {}) {
  const query = encodeURIComponent(
    'theme:TECH OR theme:SCIENCE controversialsubject'
  )
  const url = `${GDELT_BASE}?query=${query}&mode=artlist&maxrecords=${limit}&format=json&sort=DateDesc`
  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const json = await res.json()
    const articles = json.articles || []
    return articles.map((a, i) => ({
      id: `gdelt-${a.url ? btoa(a.url).slice(0,12) : i}`,
      source: 'gdelt',
      subreddit: 'r/world',
      category: guessCategory(a.title || ''),
      title: a.title || '',
      url: a.url || '',
      score: Math.floor(Math.random() * 800 + 100),
      num_comments: 0,
      thumbnail: null,
      imageUrl: a.socialimage || `https://picsum.photos/seed/gdelt${i}/960/520`,
      createdUtc: a.seendate
        ? Math.floor(new Date(a.seendate.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z')).getTime() / 1000)
        : Math.floor(Date.now() / 1000),
      stanceDistribution: { for: 34, against: 33, neutral: 33 },
      civility: 72,
      bothSides: null,
      verified: false,
      sources: [{ type: 'news', title: a.title, url: a.url, domain: safeDomain(a.url) }],
      redditComments: [],
      tweets: [],
    }))
  } catch {
    return []
  }
}

function safeDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, '') }
  catch { return 'news' }
}
