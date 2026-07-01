import type { Env } from '../types';
import type { ModerationResult } from '../types/moderation';
import { detectMaskingBypass } from './maskDetection';

const SYSTEM_PROMPT = `You are a strict comment moderation bot for a civic debate platform called Polaris.
Your job is to evaluate user comments and topic submissions for policy violations and content quality signals.

RULES:
- You MUST respond with valid JSON only. No prose, no markdown, no explanation outside JSON.
- Be strict: err on the side of flagging rather than missing.
- Hate speech, slurs, threats of violence, illegal content, severe harassment → action: "auto_delete", severity: "extreme"
- Direct personal insults, aggressive trolling, mild-to-moderate offensive content → action: "auto_delete", severity: "moderate"
- Mild hostility that doesn't warrant deletion → action: "flag", severity: "mild"
- Passive-aggressiveness, dog-whistles, subtle personal attacks without explicit slurs → action: "flag" (type: borderline or sarcasm), severity: "mild"
- Heavy irony or sarcasm that could constitute a personal attack or mockery → action: "flag" (type: irony or sarcasm), severity: "mild"
- Irony or sarcasm that is clearly not hostile → action: "allow"
- Genuinely civil discourse, even if strongly opinionated → action: "allow"

MASKING BYPASS (if text contains asterisks or symbols masking profanity like "sh*t", "f**k"):
- action: "flag", type: "masking_bypass", severity: "mild"
- reasoning must mention "Bypassed filter via masking/asterisks"

RESPONSE SCHEMA:
{
  "action": "allow" | "auto_delete" | "flag",
  "severity": "mild" | "moderate" | "extreme",
  "flags": [
    {
      "type": "offensive" | "sarcasm" | "irony" | "borderline" | "masking_bypass",
      "confidence": 0.0–1.0,
      "reasoning": "one sentence explanation"
    }
  ],
  "primaryReason": "string — required when action is auto_delete"
}

If action is "allow" and no flags, return: { "action": "allow", "severity": "mild", "flags": [] }`;

const ALLOW_RESULT: ModerationResult = {
  action: 'allow',
  severity: 'mild',
  flags: [],
};

const FALLBACK_FLAG: ModerationResult = {
  action: 'flag',
  severity: 'mild',
  flags: [
    {
      type: 'borderline',
      confidence: 0.5,
      reasoning: 'Moderation service could not parse the response; flagged for human review.',
    },
  ],
};

function parseModerationJson(text: string): ModerationResult | null {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]) as ModerationResult;
    if (!parsed.action || !['allow', 'auto_delete', 'flag'].includes(parsed.action)) {
      return null;
    }
    if (!Array.isArray(parsed.flags)) {
      parsed.flags = [];
    }
    if (!parsed.severity || !['mild', 'moderate', 'extreme'].includes(parsed.severity)) {
      parsed.severity = parsed.action === 'auto_delete' ? 'moderate' : 'mild';
    }
    return parsed;
  } catch {
    return null;
  }
}

function applyMaskingPreCheck(body: string, result: ModerationResult): ModerationResult {
  const maskingReason = detectMaskingBypass(body);
  if (!maskingReason) return result;

  if (result.action === 'allow') {
    return {
      action: 'flag',
      severity: 'mild',
      flags: [
        {
          type: 'masking_bypass',
          confidence: 0.95,
          reasoning: maskingReason,
        },
      ],
    };
  }

  const hasMaskingFlag = result.flags.some((f) => f.type === 'masking_bypass');
  if (!hasMaskingFlag) {
    result.flags.unshift({
      type: 'masking_bypass',
      confidence: 0.95,
      reasoning: maskingReason,
    });
  }
  if (result.action !== 'auto_delete') {
    result.action = 'flag';
    result.severity = 'mild';
  }
  return result;
}

export async function moderateContent(body: string, env: Env): Promise<ModerationResult> {
  const maskingReason = detectMaskingBypass(body);
  if (maskingReason && !env.ANTHROPIC_API_KEY) {
    return {
      action: 'flag',
      severity: 'mild',
      flags: [
        {
          type: 'masking_bypass',
          confidence: 0.95,
          reasoning: maskingReason,
        },
      ],
    };
  }

  if (!env.ANTHROPIC_API_KEY) {
    return ALLOW_RESULT;
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: body }],
      }),
    });

    if (!res.ok) {
      console.error('moderation API error:', res.status);
      return ALLOW_RESULT;
    }

    const data = (await res.json()) as {
      content?: { type: string; text?: string }[];
    };
    const text = data.content?.find((c) => c.type === 'text')?.text ?? '';
    const parsed = parseModerationJson(text);
    const result = parsed ?? ALLOW_RESULT;
    return applyMaskingPreCheck(body, result);
  } catch (err) {
    console.error('moderation fetch failed:', err);
    return ALLOW_RESULT;
  }
}

/** @deprecated Use moderateContent */
export async function moderateComment(body: string, env: Env): Promise<ModerationResult> {
  return moderateContent(body, env);
}
