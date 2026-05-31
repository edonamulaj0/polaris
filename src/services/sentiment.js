const POS = /\b(yes|agree|support|good|great|should|must|need|benefit|true|right|pro)\b/i
const NEG = /\b(no|disagree|oppose|bad|never|shouldn|wont|waste|wrong|false|against|con)\b/i

function stripNegations(text) {
  // [REFACTOR P-4] Remove negated phrases so "not good" does not score as positive
  return text.replace(/\b(not|never|no|without)\s+\w+/gi, '')
}

export function scoreCommentStance(text) {
  if (!text || typeof text !== 'string') return 'neutral'
  const scored = stripNegations(text)
  const p = (scored.match(POS) || []).length
  const n = (scored.match(NEG) || []).length
  if (p > n + 1) return 'for'
  if (n > p + 1) return 'against'
  return 'neutral'
}

export function distributionFromComments(comments) {
  let f = 0,
    a = 0,
    n = 0
  for (const c of comments) {
    const body = c.body || c.text || ''
    const s = scoreCommentStance(body)
    if (s === 'for') f++
    else if (s === 'against') a++
    else n++
  }
  const t = f + a + n || 1
  const fp = Math.round((100 * f) / t)
  const ap = Math.round((100 * a) / t)
  const np = Math.max(0, 100 - fp - ap)
  return { for: fp, against: ap, neutral: np }
}

export function roughCivilityFromComments(comments) {
  if (!comments.length) return 72
  const rude = /\b(idiot|stupid|moron|nazi|kill yourself|shut up)\b/i
  let hits = 0
  for (const c of comments) {
    if (rude.test(c.body || c.text || '')) hits++
  }
  const ratio = hits / comments.length
  return Math.max(40, Math.min(95, Math.round(88 - ratio * 120)))
}
