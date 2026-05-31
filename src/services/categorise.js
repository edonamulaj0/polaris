import { CATEGORIES } from '../data/categories'

/**
 * [CAT-1] Client-side category guess for legacy Reddit/GDELT paths.
 * Worker ingest uses server-side categorise.ts — this mirrors Technology/Science/Nature only.
 */
export function guessCategory(text) {
  const t = String(text || '').toLowerCase()

  if (
    /\b(ai|robot|software|algorithm|chip|cyber|hack|data|cloud|tech|digital|computer|internet|app|code|quantum|semiconductor|technology)\b/.test(
      t,
    )
  ) {
    return 'Technology' // [CAT-2]
  }

  if (
    /\b(climate|gene|vaccine|virus|asteroid|telescope|particle|physics|biology|chemistry|space|nasa|genome|protein|cancer|brain|neural|science)\b/.test(
      t,
    )
  ) {
    return 'Science' // [CAT-1]
  }

  if (
    /\b(nature|wildlife|ecosystem|species|ocean|forest|biodiversity|conservation|animal|plant|coral|glacier|habitat|extinction|rewilding|environment)\b/.test(
      t,
    )
  ) {
    return 'Nature' // [CAT-1]
  }

  return null // [CAT-3] off-topic — discard at ingest
}
