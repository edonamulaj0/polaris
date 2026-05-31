import { getCachedAnalysis, setCachedAnalysis } from './llmCache'
import {
  distributionFromComments,
  roughCivilityFromComments,
  scoreCommentStance,
} from './sentiment'

function makeRichSide(argumentsList, stakeholders, coreValues, objection, examples) {
  return {
    stakeholders,
    core_values: coreValues,
    arguments: argumentsList.map((detail) => ({ heading: '', detail })),
    strongest_objection: objection,
    notable_examples: examples,
  }
}

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

  const forArgs = forSnips.length
    ? forSnips
    : ['Proponents emphasize practical benefits seen in pilots and case studies.']
  const againstArgs = againstSnips.length
    ? againstSnips
    : ['Critics stress unintended consequences and gaps in enforcement design.']

  return {
    for: makeRichSide(
      forArgs,
      'Supporters include practitioners, industry advocates, and community members who see upside in the proposed approach.',
      'They prioritise measurable progress, innovation, and outcomes that align with stated policy or market goals.',
      'The strongest pushback questions whether benefits are evenly distributed and whether safeguards are enforceable.',
      'Recent pilots, legislative hearings, and public comment periods illustrate how this debate plays out in practice.',
    ),
    against: makeRichSide(
      againstArgs,
      'Critics include watchdog groups, affected communities, and sceptical researchers who highlight risks and trade-offs.',
      'They emphasise accountability, unintended harm, and the need for stronger evidence before scaling change.',
      'Supporters of the status quo must answer whether incremental reform can address harms critics document.',
      'Enforcement gaps, court challenges, and high-profile failures often anchor opposition narratives.',
    ),
    common_ground:
      'Participants largely want clearer facts and fair process—even when they disagree on outcomes.',
    explainer:
      'This topic draws strong opinions because stakeholders weigh different priorities — evidence, ethics, and practical impact — in conflicting ways.',
    civility_score: roughCivilityFromComments(top.map((c) => ({ body: c.body || c.text }))),
    stance_distribution: dist,
    category: 'Society',
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
    max_tokens: 2500, // [UI B-1] increased for rich bothSides schema
    messages: [
      {
        role: 'user',
        content: `You are an impartial analyst writing for an educational civic-intelligence platform.
The platform's mission is to help people understand polarized debates in technology and science.

Write for an educated non-specialist reader. Each argument's \`detail\` field must include at least one specific piece of evidence, data point, named organisation, or real-world event. Do not write generic platitudes.

Given this discussion titled: "${topic.replace(/"/g, '\\"')}"

Comments sample:
${bodyText || '(no comments available)'}

Return ONLY valid JSON, no markdown or code fences:
{
  "for": {
    "stakeholders": "string — who supports this position, 1-2 sentences naming specific groups (governments, corporations, NGOs, researchers, demographic groups)",
    "core_values": "string — the underlying values, principles, or incentives that drive supporters, 1-2 sentences",
    "arguments": [
      {
        "heading": "string — a 4-8 word argument title",
        "detail": "string — 2-3 sentences explaining the argument with evidence, data, or real-world context"
      }
    ],
    "strongest_objection": "string — the most powerful challenge supporters must answer, 1-2 sentences",
    "notable_examples": "string — real legislation, events, companies, or studies that ground this position, 1-2 sentences"
  },
  "against": {
    "stakeholders": "string — who opposes this position, 1-2 sentences naming specific groups",
    "core_values": "string — the underlying values, principles, or incentives that drive opponents, 1-2 sentences",
    "arguments": [
      {
        "heading": "string — a 4-8 word argument title",
        "detail": "string — 2-3 sentences explaining the argument with evidence, data, or real-world context"
      }
    ],
    "strongest_objection": "string — the most powerful challenge opponents must answer, 1-2 sentences",
    "notable_examples": "string — real legislation, events, companies, or studies that ground this position, 1-2 sentences"
  },
  "common_ground": "string — one sentence of shared concern both sides acknowledge",
  "explainer": "2-3 sentence plain-language explanation of why this topic is polarized and why it matters.",
  "civility_score": "integer 0-100",
  "stance_distribution": { "for": "integer %", "against": "integer %", "neutral": "integer %" },
  "category": "one of: Politics | Tech | Society | Science | Culture"
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
