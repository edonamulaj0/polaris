import { analyzeDiscussionWithLLM } from './anthropic'
import { fetchGdeltTopics } from './gdelt'
import { matchNewsForTitle, fetchTopHeadlines } from './news'
import { fetchPostComments } from './reddit'
import { searchTweetsForTopic } from './twitter'
import { distributionFromComments, roughCivilityFromComments } from './sentiment'

export { fetchGdeltTopics }

function subName(subreddit) {
  return (subreddit || '').replace(/^r\//, '')
}

/**
 * [REFACTOR D-1] Pure enrichment — returns a patch object, never mutates `post`.
 */
export async function enrichDiscussion(post, headlines) {
  if ((post.source === 'polaris' || post.source === 'curated') && post.bothSides?.for?.length) {
    return null
  }

  const sub = subName(post.subreddit)
  let comments = []
  if (post.redditId && sub) {
    try {
      comments = await fetchPostComments(sub, post.redditId)
    } catch {
      comments = []
    }
  }

  let stanceDistribution = post.stanceDistribution
  let civility = post.civility
  if (comments.length) {
    stanceDistribution = distributionFromComments(
      comments.map((c) => ({ body: c.body })),
    )
    civility = roughCivilityFromComments(comments.map((c) => ({ body: c.body })))
  }

  const sources = [...(post.sources || [])]
  const newsHits = matchNewsForTitle(post.title, headlines)
  for (const n of newsHits) {
    if (!sources.some((s) => s.url === n.url)) sources.push(n)
  }

  let tweets = []
  try {
    tweets = await searchTweetsForTopic(post.title)
  } catch {
    tweets = []
  }

  const analysis = await analyzeDiscussionWithLLM(post.id, post.title, comments)
  const bothSides = {
    for: analysis.for || [],
    against: analysis.against || [],
    common_ground: analysis.common_ground || '',
    stance_distribution: analysis.stance_distribution || stanceDistribution,
  }

  const patch = {
    redditComments: comments,
    bothSides,
    stanceDistribution: analysis.stance_distribution || stanceDistribution,
    civility: typeof analysis.civility_score === 'number' ? analysis.civility_score : civility,
    explainer: analysis.explainer || '',
    sources,
    tweets,
  }

  return patch
}

export async function loadHeadlinesOnce() {
  try {
    return await fetchTopHeadlines()
  } catch {
    return []
  }
}
