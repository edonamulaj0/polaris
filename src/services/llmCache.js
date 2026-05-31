const PREFIX = 'polaris_llm_'
const TTL_MS = 86_400_000 // 24 hours
const PRUNE_AGE_MS = 7 * 86_400_000 // 7 days

export function getCachedAnalysis(postId) {
  try {
    const raw = localStorage.getItem(PREFIX + postId)
    if (!raw) return null
    const entry = JSON.parse(raw)
    // [REFACTOR P-2] Legacy bare payload (no wrapper) — treat as stale
    if (!entry || typeof entry !== 'object' || !('data' in entry) || !('ts' in entry)) {
      localStorage.removeItem(PREFIX + postId)
      return null
    }
    if (Date.now() - entry.ts > TTL_MS) {
      localStorage.removeItem(PREFIX + postId)
      return null
    }
    return entry.data
  } catch {
    return null
  }
}

export function setCachedAnalysis(postId, payload) {
  try {
    localStorage.setItem(
      PREFIX + postId,
      JSON.stringify({ data: payload, ts: Date.now() }),
    )
  } catch {
    /* quota */
  }
}

/** [REFACTOR P-2] Drop entries older than 7 days; call once per bootstrap. */
export function pruneLlmCache() {
  try {
    const cutoff = Date.now() - PRUNE_AGE_MS
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith(PREFIX)) continue
      try {
        const entry = JSON.parse(localStorage.getItem(key))
        if (!entry?.ts || entry.ts < cutoff) keysToRemove.push(key)
      } catch {
        keysToRemove.push(key)
      }
    }
    for (const key of keysToRemove) localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}
