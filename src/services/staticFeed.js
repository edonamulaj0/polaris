/**
 * Curated feed produced by `npm run fetch-discussions` → public/discussions.json
 */
function assetUrl(path) {
  const base = import.meta.env.BASE_URL || '/'
  const p = path.startsWith('/') ? path : `/${path}`
  if (base === '/') return p
  return `${base.replace(/\/$/, '')}${p}`
}

export async function loadCuratedDiscussions() {
  try {
    const res = await fetch(assetUrl('discussions.json'), { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) return null
    return data.map((row) => ({
      ...row,
      sources: Array.isArray(row.sources) ? row.sources : [],
      redditComments: row.redditComments ?? [],
      tweets: row.tweets ?? [],
    }))
  } catch {
    return null
  }
}
