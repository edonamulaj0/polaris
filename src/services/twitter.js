function twitterBase() {
  if (import.meta.env.DEV && import.meta.env.VITE_TWITTER_BEARER_TOKEN) return '/twitterapi'
  return null
}

export async function searchTweetsForTopic(title) {
  const base = twitterBase()
  if (!base) return []
  const q = encodeURIComponent(title.slice(0, 80))
  const url = `${base}/2/tweets/search/recent?query=${q}&max_results=10&tweet.fields=public_metrics,created_at`
  const res = await fetch(url)
  if (!res.ok) return []
  const json = await res.json()
  const list = json.data || []
  return list.map((t) => ({
    id: t.id,
    text: t.text,
    likes: t.public_metrics?.like_count ?? 0,
    retweets: t.public_metrics?.retweet_count ?? 0,
  }))
}
