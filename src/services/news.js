function newsBase() {
  if (import.meta.env.DEV && import.meta.env.VITE_NEWS_API_KEY) return '/newsapi'
  return null
}

export async function fetchTopHeadlines() {
  const base = newsBase()
  if (!base) return []
  const url = `${base}/top-headlines?category=general&language=en&pageSize=40`
  const res = await fetch(url)
  if (!res.ok) return []
  const json = await res.json()
  return (json.articles || []).map((a, i) => ({
    id: `news-${i}-${a.title?.slice(0, 8) || i}`,
    title: a.title,
    description: a.description,
    url: a.url,
    image: a.urlToImage,
    source: a.source?.name || 'News',
    publishedAt: a.publishedAt,
    keywords: tokenize(`${a.title} ${a.description || ''}`),
  }))
}

function tokenize(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3)
}

export function keywordOverlap(title, article) {
  const t = new Set(tokenize(title))
  if (!t.size) return 0
  let hit = 0
  for (const w of article.keywords || []) {
    if (t.has(w)) hit++
  }
  return hit
}

export function matchNewsForTitle(title, articles, topN = 2) {
  if (!articles.length) return []
  const scored = articles
    .map((a) => ({ a, score: keywordOverlap(title, a) }))
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, topN)
    .map(({ a }) => ({
      type: 'news',
      title: a.title,
      url: a.url,
      domain: safeDomain(a.url),
      image: a.image,
    }))
  return scored
}

function safeDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'news'
  }
}
