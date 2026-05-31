// [UI-1] Strip subreddit prefix from display labels
export function formatSource(subreddit) {
  if (!subreddit) return ''
  return subreddit.replace(/^r\//i, '')
}
