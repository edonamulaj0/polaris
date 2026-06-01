// worker/src/jobs/ingest.ts
// [WRK-5] Scheduled ingest — fetch news, synthesise via Workers AI, store in D1

import type { Env } from '../types';
import { categoriseArticle, type ArticleCategory } from '../lib/categorise';
import { synthesiseArticle } from '../lib/synthesise';

const MAX_ARTICLES_PER_RUN = 15; // [WRK-5]
const CONCURRENCY = 3; // [WRK-5]

export interface RawNewsItem {
  title: string;
  url: string;
  bodySnippet: string;
  section: string;
  imageUrl: string | null;
  sourceTitle: string;
  domain: string;
}

async function hashUrl(url: string): Promise<string> {
  const encoder = new TextEncoder(); // [WRK-5]
  const data = encoder.encode(url); // [WRK-5]
  const hashBuffer = await crypto.subtle.digest('SHA-256', data); // [WRK-5]
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // [WRK-5]
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join(''); // [WRK-5]
  return `art-${hashHex.slice(0, 12)}`; // [WRK-5]
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, ''); // [WRK-5]
  } catch {
    return 'unknown'; // [WRK-5]
  }
}

async function fetchGuardian(env: Env): Promise<RawNewsItem[]> {
  const sections = ['technology', 'science', 'environment']; // [WRK-5]
  const items: RawNewsItem[] = []; // [WRK-5]

  const fetches = sections.map(async (section) => {
    const url = `https://content.guardianapis.com/search?section=${section}&show-fields=bodyText,thumbnail&page-size=10&api-key=${env.GUARDIAN_API_KEY}`; // [WRK-5]
    try {
      const res = await fetch(url); // [WRK-5]
      if (!res.ok) return; // [WRK-5]
      const data = (await res.json()) as {
        response?: {
          results?: {
            webTitle: string;
            webUrl: string;
            fields?: { bodyText?: string; thumbnail?: string };
          }[];
        };
      }; // [WRK-5]

      for (const r of data.response?.results ?? []) {
        items.push({
          title: r.webTitle, // [WRK-5]
          url: r.webUrl, // [WRK-5]
          bodySnippet: r.fields?.bodyText || r.webTitle, // [WRK-5]
          section, // [WRK-5]
          imageUrl: r.fields?.thumbnail || null, // [WRK-5]
          sourceTitle: 'The Guardian', // [WRK-5]
          domain: 'theguardian.com', // [WRK-5]
        });
      }
    } catch {
      // skip failed section // [WRK-5]
    }
  });

  await Promise.allSettled(fetches); // [WRK-5]
  return items; // [WRK-5]
}

async function fetchHackerNews(): Promise<RawNewsItem[]> {
  const queries = ['technology', 'science', 'nature']; // [WRK-5]
  const items: RawNewsItem[] = []; // [WRK-5]

  const fetches = queries.map(async (query) => {
    const url = `https://hn.algolia.com/api/v1/search?tags=story&query=${query}&hitsPerPage=10`; // [WRK-5]
    try {
      const res = await fetch(url); // [WRK-5]
      if (!res.ok) return; // [WRK-5]
      const data = (await res.json()) as {
        hits?: { title: string; url: string; story_text?: string }[];
      }; // [WRK-5]

      for (const hit of data.hits ?? []) {
        if (!hit.url) continue; // [WRK-5]
        items.push({
          title: hit.title, // [WRK-5]
          url: hit.url, // [WRK-5]
          bodySnippet: hit.story_text || hit.title, // [WRK-5]
          section: query, // [WRK-5]
          imageUrl: null, // [WRK-5]
          sourceTitle: 'Hacker News', // [WRK-5]
          domain: extractDomain(hit.url), // [WRK-5]
        });
      }
    } catch {
      // skip failed query // [WRK-5]
    }
  });

  await Promise.allSettled(fetches); // [WRK-5]
  return items; // [WRK-5]
}

async function fetchGdelt(): Promise<RawNewsItem[]> {
  const items: RawNewsItem[] = []; // [WRK-5]
  const queries = [
    'theme:TECH OR theme:SCIENCE',
    'theme:ENVIRONMENT OR theme:BIODIVERSITY',
  ]; // [WRK-5]

  const fetches = queries.map(async (query) => {
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=artlist&maxrecords=10&format=json&sort=DateDesc`; // [WRK-5]
    try {
      const res = await fetch(url); // [WRK-5]
      if (!res.ok) return; // [WRK-5]
      const data = (await res.json()) as {
        articles?: { title: string; url: string; domain?: string }[];
      }; // [WRK-5]

      for (const article of data.articles ?? []) {
        items.push({
          title: article.title, // [WRK-5]
          url: article.url, // [WRK-5]
          bodySnippet: article.title, // [WRK-5]
          section: query, // [WRK-5]
          imageUrl: null, // [WRK-5]
          sourceTitle: article.domain || 'GDELT', // [WRK-5]
          domain: article.domain || extractDomain(article.url), // [WRK-5]
        });
      }
    } catch {
      // skip failed query // [WRK-5]
    }
  });

  await Promise.allSettled(fetches); // [WRK-5]
  return items; // [WRK-5]
}

async function articleExists(db: D1Database, id: string): Promise<boolean> {
  const row = await db.prepare(`SELECT id FROM articles WHERE id = ?`).bind(id).first(); // [WRK-5]
  return row !== null; // [WRK-5]
}

async function processItem(env: Env, item: RawNewsItem, category: ArticleCategory): Promise<boolean> {
  const id = await hashUrl(item.url); // [WRK-5]

  if (await articleExists(env.DB, id)) {
    return false; // [WRK-5]
  }

  const synthesised = await synthesiseArticle(env, item.title, item.bodySnippet, item.url); // [WRK-5]
  if (!synthesised) {
    return false; // [WRK-5]
  }

  const sourceUrls = JSON.stringify([
    { title: item.sourceTitle, url: item.url, domain: item.domain },
  ]); // [WRK-5]

  const civility = Math.min(100, Math.max(0, synthesised.civility_score || 75)); // [WRK-5]
  const stanceFor = synthesised.stance_distribution?.for ?? 33; // [WRK-5]
  const stanceAgainst = synthesised.stance_distribution?.against ?? 33; // [WRK-5]
  const stanceNeutral = synthesised.stance_distribution?.neutral ?? 34; // [WRK-5]

  await env.DB.prepare(
    `INSERT INTO articles (
      id, title, category, image_url,
      lede, background, perspectives, evidence, counterpoint, implications, conclusion,
      source_urls, civility, stance_for, stance_against, stance_neutral,
      verified, source_type
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'ingest')`,
  )
    .bind(
      id,
      item.title,
      category,
      item.imageUrl,
      synthesised.lede,
      synthesised.background,
      synthesised.perspectives,
      synthesised.evidence,
      synthesised.counterpoint,
      synthesised.implications,
      synthesised.conclusion,
      sourceUrls,
      civility,
      stanceFor,
      stanceAgainst,
      stanceNeutral,
    )
    .run(); // [WRK-5]

  return true; // [WRK-5]
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<boolean>,
): Promise<number> {
  let processed = 0; // [WRK-5]
  let index = 0; // [WRK-5]

  async function worker(): Promise<void> {
    while (index < items.length && processed < MAX_ARTICLES_PER_RUN) {
      const currentIndex = index++; // [WRK-5]
      const item = items[currentIndex]; // [WRK-5]
      try {
        const success = await fn(item); // [WRK-5]
        if (success) processed++; // [WRK-5]
      } catch {
        // skip failed item // [WRK-5]
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker()); // [WRK-5]
  await Promise.allSettled(workers); // [WRK-5]
  return processed; // [WRK-5]
}

export async function runIngest(env: Env): Promise<{ ingested: number; candidates: number }> {
  const [guardian, hn, gdelt] = await Promise.all([
    fetchGuardian(env),
    fetchHackerNews(),
    fetchGdelt(),
  ]); // [WRK-5]

  const allRaw = [...guardian, ...hn, ...gdelt]; // [WRK-5]

  const seenUrls = new Set<string>(); // [WRK-5]
  const candidates: { item: RawNewsItem; category: ArticleCategory }[] = []; // [WRK-5]

  for (const item of allRaw) {
    if (seenUrls.has(item.url)) continue; // [WRK-5]
    seenUrls.add(item.url); // [WRK-5]

    const category = categoriseArticle(item.title, item.section); // [WRK-5]
    if (!category) continue; // [WRK-5]

    const id = await hashUrl(item.url); // [WRK-5]
    if (await articleExists(env.DB, id)) continue; // [WRK-5]

    candidates.push({ item, category }); // [WRK-5]
  }

  const toProcess = candidates.slice(0, MAX_ARTICLES_PER_RUN); // [WRK-5]

  const ingested = await runWithConcurrency(
    toProcess,
    CONCURRENCY,
    ({ item, category }) => processItem(env, item, category),
  ); // [WRK-5]

  console.log(`ingest complete: ${ingested}/${toProcess.length} articles stored`); // [WRK-5]
  return { ingested, candidates: candidates.length }; // [WRK-5]
}
