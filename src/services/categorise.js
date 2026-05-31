/**
 * Shared category labelling for Reddit subreddits and article titles.
 * [REFACTOR P-1] Merged rule set formerly split across reddit.js and gdelt.js.
 */
export function guessCategory(text) {
  const t = String(text).toLowerCase()

  // Subreddit-name rules (reddit.js)
  if (t.includes('politics') || t.includes('worldnews')) return 'Politics'
  if (t.includes('technology')) return 'Tech'
  if (t.includes('science')) return 'Science'
  if (t.includes('askreddit')) return 'Society'

  // Title-keyword rules (gdelt.js)
  if (
    /\b(ai|robot|software|algorithm|chip|semiconductor|cyber|hack|data|cloud|tech|digital)\b/.test(
      t,
    )
  )
    return 'Tech'
  if (
    /\b(climate|gene|vaccine|virus|asteroid|telescope|particle|physics|biology|chemistry|space)\b/.test(
      t,
    )
  )
    return 'Science'

  return 'Society'
}
