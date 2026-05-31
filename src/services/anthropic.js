import { getCachedAnalysis, setCachedAnalysis } from './llmCache'
import {
  distributionFromComments,
  roughCivilityFromComments,
  scoreCommentStance,
} from './sentiment'

function localAnalysis(topic, comments) {
  const top = comments.slice(0, 20)
  const forSnips = top
    .filter((c) => scoreCommentStance(c.body || c.text) === 'for')
    .slice(0, 3)
    .map((c) => (c.body || c.text || '').slice(0, 220))
  const againstSnips = top
    .filter((c) => scoreCommentStance(c.body || c.text) === 'against')
    .slice(0, 3)
    .map((c) => (c.body || c.text || '').slice(0, 220))
  const dist = distributionFromComments(top.map((c) => ({ body: c.body || c.text })))
  return {
    for: forSnips.length ? forSnips : ['Proponents emphasize practical benefits seen in pilots and case studies.'],
    against: againstSnips.length
      ? againstSnips
      : ['Critics stress unintended consequences and gaps in enforcement design.'],
    common_ground:
      'Participants largely want clearer facts and fair process—even when they disagree on outcomes.',
    explainer:
      'This topic draws strong opinions because stakeholders weigh different priorities — evidence, ethics, and practical impact — in conflicting ways.',
    civility_score: roughCivilityFromComments(top.map((c) => ({ body: c.body || c.text }))),
    stance_distribution: dist,
  }
}

export async function analyzeDiscussionWithLLM(postId, topic, comments) {
  const cached = getCachedAnalysis(postId)
  if (cached) return cached

  const sample = comments.slice(0, 20)
  const bodyText = sample.map((c) => `- (${c.score ?? 0}) ${c.body || c.text || ''}`).join('\n')

  // [REFACTOR S-1] Dev proxy only — never inject a client-side API key
  const useProxy = import.meta.env.DEV
  const url = useProxy
    ? '/anthropic/v1/messages'
    : 'https://api.anthropic.com/v1/messages'

  const payload = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 900,
    messages: [
      {
        role: 'user',
        content: `You are an impartial analyst writing for an educational civic-intelligence platform.
The platform's mission is to help people understand polarized debates in technology and science.

Given this discussion titled: "${topic.replace(/"/g,'\\"')}"

Comments sample:
${bodyText || '(no comments available)'}

Return ONLY valid JSON, no markdown or code fences:
{
  "for": [
    "Concise argument supporting the position (1-2 sentences, educational tone)",
    "Second supporting argument",
    "Third supporting argument"
  ],
  "against": [
    "Concise argument opposing the position (1-2 sentences, educational tone)",
    "Second opposing argument",
    "Third opposing argument"
  ],
  "common_ground": "One sentence describing what both sides ultimately agree on or share as a concern.",
  "explainer": "2-3 sentence plain-language explanation of why this topic is polarized and why it matters.",
  "civility_score": <integer 0-100, where 100 is perfectly civil>,
  "stance_distribution": { "for": <integer %>, "against": <integer %>, "neutral": <integer %> }
}`,
      },
    ],
  }

  try {
    if (!useProxy) {
      // [REFACTOR S-1] Production has no safe client-side key path — skip remote call
      throw new Error('no-proxy')
    }
    const headers = {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    }
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) })
    if (!res.ok) throw new Error(String(res.status))
    const json = await res.json()
    const text = json?.content?.[0]?.text || ''
    const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}')
    if (parsed.for && parsed.against) {
      setCachedAnalysis(postId, parsed)
      return parsed
    }
  } catch {
    /* fall through to localAnalysis */
  }

  const fallback = localAnalysis(topic, sample)
  setCachedAnalysis(postId, fallback)
  return fallback
}
