// worker/src/lib/voteHelpers.ts
// [WRK-4] Vote distribution queries and updates

export interface VoteDistribution {
  for: number;
  against: number;
  neutral: number;
}

export async function getVoteDistribution(
  db: D1Database,
  articleId: string,
): Promise<VoteDistribution & { total: number }> {
  const { results } = await db
    .prepare(
      `SELECT stance, COUNT(*) as count FROM votes WHERE article_id = ? GROUP BY stance`,
    )
    .bind(articleId)
    .all<{ stance: string; count: number }>(); // [WRK-4]

  let forCount = 0; // [WRK-4]
  let againstCount = 0; // [WRK-4]
  let neutralCount = 0; // [WRK-4]

  for (const row of results) {
    if (row.stance === 'For') forCount = row.count; // [WRK-4]
    else if (row.stance === 'Against') againstCount = row.count; // [WRK-4]
    else if (row.stance === 'Neutral') neutralCount = row.count; // [WRK-4]
  }

  const total = forCount + againstCount + neutralCount; // [WRK-4]

  if (total === 0) {
    return { for: 33, against: 33, neutral: 34, total: 0 }; // [WRK-4]
  }

  const forPct = Math.round((forCount / total) * 100); // [WRK-4]
  const againstPct = Math.round((againstCount / total) * 100); // [WRK-4]
  const neutralPct = 100 - forPct - againstPct; // [WRK-4]

  return {
    for: forPct, // [WRK-4]
    against: againstPct, // [WRK-4]
    neutral: neutralPct, // [WRK-4]
    total, // [WRK-4]
  };
}

export async function syncArticleStanceCounts(
  db: D1Database,
  articleId: string,
): Promise<VoteDistribution> {
  const dist = await getVoteDistribution(db, articleId); // [WRK-4]

  if (dist.total > 0) {
    await db
      .prepare(
        `UPDATE articles SET stance_for = ?, stance_against = ?, stance_neutral = ? WHERE id = ?`,
      )
      .bind(dist.for, dist.against, dist.neutral, articleId)
      .run(); // [WRK-4]
  }

  return { for: dist.for, against: dist.against, neutral: dist.neutral }; // [WRK-4]
}
