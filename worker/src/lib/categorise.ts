// worker/src/lib/categorise.ts
// [CAT-3] Categorise raw news items — discard off-topic posts

export type ArticleCategory = 'Technology' | 'Science' | 'Nature'; // [CAT-3]

export function categoriseArticle(
  title: string,
  section: string,
): ArticleCategory | null {
  const t = (title + ' ' + section).toLowerCase(); // [CAT-3]

  if (
    /\b(ai|robot|software|algorithm|chip|cyber|hack|data|cloud|tech|digital|computer|internet|app|code|quantum|semiconductor)\b/.test(
      t,
    )
  ) {
    return 'Technology'; // [CAT-3]
  }

  if (
    /\b(climate|gene|vaccine|virus|asteroid|telescope|particle|physics|biology|chemistry|space|nasa|genome|protein|cancer|brain|neural)\b/.test(
      t,
    )
  ) {
    return 'Science'; // [CAT-3]
  }

  if (
    /\b(nature|wildlife|ecosystem|species|ocean|forest|biodiversity|conservation|animal|plant|coral|glacier|habitat|extinction|rewilding)\b/.test(
      t,
    )
  ) {
    return 'Nature'; // [CAT-3]
  }

  return null; // [CAT-3]
}
