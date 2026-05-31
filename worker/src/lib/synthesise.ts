// worker/src/lib/synthesise.ts
// [ART-2] Workers AI article synthesis with Gemini fallback

import type { Env } from '../types';

export interface SynthesisedArticle {
  lede: string;
  background: string;
  perspectives: string;
  evidence: string;
  counterpoint: string;
  implications: string;
  conclusion: string;
  civility_score: number;
  stance_distribution: { for: number; against: number; neutral: number };
}

function buildPrompt(title: string, bodySnippet: string, url: string): string {
  const snippet = bodySnippet.slice(0, 800); // [ART-2]
  return `You are a news editor for a science and technology magazine aimed at educated general readers.

Write a detailed, factual news article about the following topic. The article must be written entirely in prose paragraphs — absolutely no bullet points, no numbered lists, no headers, no markdown formatting of any kind. Write as a professional journalist would for a quality newspaper.

Topic: ${title}
Source material: ${snippet}
Source URL: ${url}

Return ONLY valid JSON with these exact fields (all values are plain text strings, no markdown):
{
  "lede": "Opening paragraph. Establishes who, what, when, where, why. Grabs the reader. 3-4 sentences.",
  "background": "Context paragraph. Explains the history and background a reader needs to understand this story. 3-5 sentences.",
  "perspectives": "Perspectives paragraph. Describes the range of views stakeholders hold on this topic — supporters, sceptics, researchers, governments, industry. Name specific groups. 4-6 sentences. No bullet points.",
  "evidence": "Evidence paragraph. Cites specific data, studies, statistics, named researchers or institutions, and concrete examples. 4-6 sentences.",
  "counterpoint": "Counterpoint paragraph. Presents the strongest challenge or opposing view to the dominant narrative in the source material. 3-4 sentences.",
  "implications": "Implications paragraph. Explains what this means for the future — policy, society, the environment, or everyday life. 3-5 sentences.",
  "conclusion": "Conclusion paragraph. A measured, forward-looking close. Does not introduce new facts. 2-3 sentences.",
  "civility_score": <integer 0-100>,
  "stance_distribution": { "for": <integer %, sum to 100>, "against": <integer %>, "neutral": <integer %> }
}`; // [ART-2]
}

function parseSynthesisResponse(text: string): SynthesisedArticle | null {
  const trimmed = text.trim(); // [ART-2]
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/); // [ART-2]
  if (!jsonMatch) return null; // [ART-2]

  try {
    const parsed = JSON.parse(jsonMatch[0]) as SynthesisedArticle; // [ART-2]
    if (!parsed.lede || !parsed.background || !parsed.conclusion) return null; // [ART-2]
    return parsed; // [ART-2]
  } catch {
    return null; // [ART-2]
  }
}

function isQualityOutput(article: SynthesisedArticle): boolean {
  const fields = [
    article.lede,
    article.background,
    article.perspectives,
    article.evidence,
    article.counterpoint,
    article.implications,
    article.conclusion,
  ]; // [ART-2]

  for (const field of fields) {
    if (!field || field.length < 50) return false; // [ART-2]
    if (/^[\s\-•*\d.]/.test(field)) return false; // [ART-2]
  }

  return true; // [ART-2]
}

async function synthesiseWithWorkersAI(
  env: Env,
  prompt: string,
): Promise<SynthesisedArticle | null> {
  try {
    const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4096,
    }); // [ART-2]

    const text =
      typeof response === 'string'
        ? response
        : (response as { response?: string }).response || JSON.stringify(response); // [ART-2]

    const parsed = parseSynthesisResponse(text); // [ART-2]
    if (parsed && isQualityOutput(parsed)) return parsed; // [ART-2]
    return null; // [ART-2]
  } catch {
    return null; // [ART-2]
  }
}

async function synthesiseWithGemini(
  env: Env,
  prompt: string,
): Promise<SynthesisedArticle | null> {
  const apiKey = env.GEMINI_API_KEY; // [ART-2]
  if (!apiKey) return null; // [ART-2]

  try {
    const res = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      },
    ); // [ART-2]

    if (!res.ok) return null; // [ART-2]

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    }; // [ART-2]

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text; // [ART-2]
    if (!text) return null; // [ART-2]

    const parsed = parseSynthesisResponse(text); // [ART-2]
    if (parsed && isQualityOutput(parsed)) return parsed; // [ART-2]
    return null; // [ART-2]
  } catch {
    return null; // [ART-2]
  }
}

export async function synthesiseArticle(
  env: Env,
  title: string,
  bodySnippet: string,
  url: string,
): Promise<SynthesisedArticle | null> {
  const prompt = buildPrompt(title, bodySnippet, url); // [ART-2]

  const workersResult = await synthesiseWithWorkersAI(env, prompt); // [ART-2]
  if (workersResult) return workersResult; // [ART-2]

  return synthesiseWithGemini(env, prompt); // [ART-2]
}
