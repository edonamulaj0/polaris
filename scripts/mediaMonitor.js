/**
 * Media monitoring & content curation: Guardian API → Gemini → terminal report.
 *
 * Credentials (same names as polaris-worker):
 *   GUARDIAN_API_KEY, GEMINI_API_KEY
 *
 * Loaded automatically from project `.dev.vars` (Wrangler local secrets) when not
 * already in the environment. Production Worker secrets are not read here — use
 * `.dev.vars` at repo root for local runs.
 *
 * Run: npm run media-monitor
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

/** Wrangler-style KEY=value file (root `.dev.vars`, same keys as worker secrets). */
function loadDevVars() {
  const paths = [join(REPO_ROOT, '.dev.vars'), join(REPO_ROOT, 'worker', '.dev.vars')];

  for (const filePath of paths) {
    if (!existsSync(filePath)) continue;

    for (const line of readFileSync(filePath, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

const GUARDIAN_SEARCH_URL = 'https://content.guardianapis.com/search';
const PRIMARY_GEMINI_MODEL = 'gemini-2.5-flash';
/** Same fallback as polaris-worker when 2.5-flash is blocked on the API project. */
const FALLBACK_GEMINI_MODEL = 'gemini-2.0-flash';
const MAX_BODY_CHARS = 5000;
const DEFAULT_BYLINE = 'The Guardian Staff';
/** Free tier: 5 generateContent requests/min per model — pace calls accordingly. */
const GEMINI_DELAY_MS = 15_000;
const MAX_GEMINI_RETRIES = 5;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** @param {unknown} err */
function formatError(err) {
  const raw = err instanceof Error ? err.message : String(err);
  try {
    const parsed = JSON.parse(raw);
    return parsed?.error?.message ?? raw;
  } catch {
    return raw;
  }
}

/** @param {string} message */
function parseRetryMs(message) {
  const match = message.match(/retry in ([\d.]+)s/i);
  if (match) return Math.ceil(Number(match[1]) * 1000) + 2000;
  return 62_000;
}

/** @param {string} message */
function isAccessDenied(message) {
  return /denied access|permission_denied/i.test(message);
}

/** @param {string} message */
function isQuotaExceeded(message) {
  return /quota|resource_exhausted|429/i.test(message);
}

/** @type {string[]} */
let activeGeminiModels = [PRIMARY_GEMINI_MODEL, FALLBACK_GEMINI_MODEL];

/**
 * Probe models once so we skip 2.5-flash when the project cannot use it.
 * @param {import('@google/genai').GoogleGenAI} ai
 */
async function resolveGeminiModels(ai) {
  try {
    await ai.models.generateContent({
      model: PRIMARY_GEMINI_MODEL,
      contents: 'Reply with the single word: ping',
    });
    activeGeminiModels = [PRIMARY_GEMINI_MODEL, FALLBACK_GEMINI_MODEL];
    return;
  } catch (err) {
    const message = formatError(err);
    if (!isAccessDenied(message)) return;

    console.warn(
      `Warning: ${PRIMARY_GEMINI_MODEL} is not enabled for this API project (403). ` +
        `Using ${FALLBACK_GEMINI_MODEL} instead (same as polaris-worker fallback).\n`,
    );
    activeGeminiModels = [FALLBACK_GEMINI_MODEL];
  }
}

const SYSTEM_INSTRUCTION = `You are a neutral media analyst. Read the article and produce EXACTLY two sentences summarizing the core debate in the story.
- Use a neutral tone; explain why reasonable, informed people disagree based on values or evidence.
- Do not take a side, advocate for a position, or use inflammatory, loaded, or partisan language.
- Output only those two sentences, with no preamble, labels, or bullet points.`;

/** @type {{ category: string; subtopic: string; query: string }[]} */
const TOPICS = [
  { category: 'Technology & Society', subtopic: 'AI Ethics & Regulation', query: 'AI ethics regulation' },
  { category: 'Technology & Society', subtopic: 'Digital Privacy vs Surveillance', query: 'surveillance data privacy' },
  { category: 'Science & Ethics', subtopic: 'Nuclear Energy', query: 'nuclear energy clean risk' },
  { category: 'Science & Ethics', subtopic: 'Genetic Engineering & CRISPR', query: 'CRISPR gene editing ethics' },
  { category: 'Economy & Future', subtopic: 'Universal Basic Income', query: 'universal basic income debate' },
  { category: 'Economy & Future', subtopic: 'Four-Day Work Week', query: 'four day work week productivity' },
  { category: 'Economy & Future', subtopic: 'Space Colonisation Ethics', query: 'space colonisation ownership ethics' },
  { category: 'Medicine & Bioethics', subtopic: 'Euthanasia & Assisted Dying', query: 'assisted dying euthanasia ethics' },
  { category: 'Urban & Environmental', subtopic: 'Vertical Farming & Lab-Grown Meat', query: 'lab grown meat vertical farming' },
  { category: 'Urban & Environmental', subtopic: 'Rewilding Cities', query: 'rewilding urban green space' },
];

function requireApiKeys() {
  const missing = [];
  if (!process.env.GUARDIAN_API_KEY) missing.push('GUARDIAN_API_KEY');
  if (!process.env.GEMINI_API_KEY) missing.push('GEMINI_API_KEY');
  if (missing.length > 0) {
    console.error(`Error: Missing required environment variable(s): ${missing.join(', ')}`);
    console.error('Add them to .dev.vars at the repo root (same file Wrangler uses locally).');
    process.exit(1);
  }
}

/**
 * @param {string} query
 * @returns {Promise<{ webTitle: string; webUrl: string; byline: string; bodyText: string } | null>}
 */
async function fetchGuardianArticle(query) {
  const params = new URLSearchParams({
    q: query,
    'api-key': process.env.GUARDIAN_API_KEY,
    'show-fields': 'bodyText,byline',
    'page-size': '1',
    'order-by': 'newest',
  });

  const url = `${GUARDIAN_SEARCH_URL}?${params}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Guardian API HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  const results = data?.response?.results;

  if (!Array.isArray(results) || results.length === 0) {
    return null;
  }

  const article = results[0];
  const fields = article.fields ?? {};

  return {
    webTitle: article.webTitle ?? 'Untitled',
    webUrl: article.webUrl ?? '',
    byline: (fields.byline ?? '').trim() || DEFAULT_BYLINE,
    bodyText: fields.bodyText ?? '',
  };
}

/**
 * @param {import('@google/genai').GoogleGenAI} ai
 * @param {string} model
 * @param {string} bodyText
 * @param {number} [attempt]
 * @returns {Promise<string>}
 */
async function summarizeWithModel(ai, model, bodyText, attempt = 0) {
  const truncated = bodyText.slice(0, MAX_BODY_CHARS);
  if (!truncated.trim()) {
    throw new Error('Article body is empty; cannot summarize.');
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Summarize the core debate in this article:\n\n${truncated}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    const text = response?.text?.trim();
    if (!text) {
      throw new Error('Gemini returned an empty summary.');
    }

    return text;
  } catch (err) {
    const message = formatError(err);

    if (isQuotaExceeded(message) && attempt < MAX_GEMINI_RETRIES) {
      const waitMs = parseRetryMs(message);
      console.warn(`  Rate limited on ${model}; waiting ${Math.round(waitMs / 1000)}s before retry…`);
      await sleep(waitMs);
      return summarizeWithModel(ai, model, bodyText, attempt + 1);
    }

    throw err;
  }
}

/**
 * @param {import('@google/genai').GoogleGenAI} ai
 * @param {string} bodyText
 * @returns {Promise<string>}
 */
async function summarizeDebate(ai, bodyText) {
  let lastError = new Error('No Gemini models configured.');

  for (let i = 0; i < activeGeminiModels.length; i += 1) {
    const model = activeGeminiModels[i];
    try {
      return await summarizeWithModel(ai, model, bodyText);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const message = formatError(err);
      const hasFallback = i < activeGeminiModels.length - 1;
      if (hasFallback && isAccessDenied(message)) {
        console.warn(`  ${model} unavailable; trying ${activeGeminiModels[i + 1]}…`);
        continue;
      }
      throw lastError;
    }
  }

  throw lastError;
}

/**
 * @param {{ category: string; subtopic: string; query: string }} topic
 * @param {{ webTitle: string; webUrl: string; byline: string; bodyText: string }} article
 * @param {string} summary
 */
function printSubtopicReport(topic, article, summary) {
  console.log(`\n### ${topic.category}`);
  console.log(`#### ${topic.subtopic}`);
  console.log(`- **Article Title:** ${article.webTitle}`);
  console.log(`- **Source/Author:** ${article.byline}`);
  console.log(`- **Link:** ${article.webUrl}`);
  console.log(`- **The Core Debate:** ${summary}`);
}

async function main() {
  loadDevVars();
  requireApiKeys();

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  console.log('Polaris Media Monitor — Guardian × Gemini');
  await resolveGeminiModels(ai);
  console.log(`Model(s): ${activeGeminiModels.join(' → ')}`);
  console.log(`Processing ${TOPICS.length} subtopics (~${Math.ceil((TOPICS.length * GEMINI_DELAY_MS) / 60_000)} min at free-tier pace)…\n`);

  let succeeded = 0;
  let failed = 0;
  let geminiCalls = 0;

  for (const topic of TOPICS) {
    let article;

    try {
      article = await fetchGuardianArticle(topic.query);
    } catch (err) {
      failed += 1;
      console.error(`\n[${topic.category} › ${topic.subtopic}] Guardian fetch failed: ${formatError(err)}`);
      continue;
    }

    if (!article) {
      failed += 1;
      console.error(`\n[${topic.category} › ${topic.subtopic}] No Guardian articles found for query: "${topic.query}"`);
      continue;
    }

    if (!article.bodyText.trim()) {
      failed += 1;
      console.error(`\n[${topic.category} › ${topic.subtopic}] Article has no body text: ${article.webTitle}`);
      continue;
    }

    let summary;

    try {
      if (geminiCalls > 0) {
        await sleep(GEMINI_DELAY_MS);
      }
      summary = await summarizeDebate(ai, article.bodyText);
      geminiCalls += 1;
    } catch (err) {
      failed += 1;
      const message = formatError(err);
      console.error(`\n[${topic.category} › ${topic.subtopic}] Gemini summarization failed: ${message}`);
      if (isQuotaExceeded(message)) {
        console.error(
          '  Tip: Free tier allows 5 requests/min per model. Wait a minute and re-run, or enable billing: https://ai.google.dev/pricing',
        );
      }
      continue;
    }

    printSubtopicReport(topic, article, summary);
    succeeded += 1;
  }

  console.log(`\n---\nDone: ${succeeded} succeeded, ${failed} failed (${TOPICS.length} total).`);

  if (succeeded === 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
