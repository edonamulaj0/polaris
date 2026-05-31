/**
 * Build public/articles.json from scripts/guardian-raw.json (no Gemini).
 * Run: node scripts/buildArticleSeed.js
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scoreRelevance, synthesizeArticle } from './synthesizeLocal.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_PATH = join(__dirname, 'guardian-raw.json');
const OUT_PATH = join(__dirname, '../public/articles.json');
const TARGET = 50;

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'theguardian.com';
  }
}

function inferCategory(item) {
  const path = item.url.toLowerCase();
  if (/\/technology\//.test(path)) return 'Technology';
  if (/\/environment\//.test(path)) return 'Nature';
  if (/\/science\//.test(path)) return 'Science';
  if (/\/business\//.test(path)) return 'Technology';
  if (/\/world\//.test(path)) return 'Science';
  if (/\/society\//.test(path)) return 'Science';
  if (/\/politics\//.test(path)) return 'Science';
  if (/\/australia-news\//.test(path)) return 'Science';
  const text = `${item.title} ${item.bodyText}`.toLowerCase();
  if (/climate|wildlife|forest|ocean|carbon|renewable|species|pollution/.test(text)) return 'Nature';
  if (/ai |artificial intelligence|cyber|software|chip|quantum|data privacy/.test(text)) return 'Technology';
  if (/study|research|trial|vaccine|gene|nuclear|medical/.test(text)) return 'Science';
  return item.category;
}

function isUsable(item) {
  const path = item.url.toLowerCase();
  if (
    /\/football\/|\/sport\/|\/music\/|\/film\/|\/tv-and-radio\/|\/games\/|\/live\//.test(
      path,
    )
  ) {
    return false;
  }
  if (/news\/live|as it happened|corrections and clarifications|brief letters/i.test(item.title)) {
    return false;
  }
  return (
    item.bodyText?.length > 250 &&
    !/as it happened|live updates/i.test(item.title) &&
    !(item.bodyText.length > 10000 && /\d+\s*min/i.test(item.bodyText))
  );
}

function main() {
  if (!existsSync(RAW_PATH)) {
    console.error('Missing guardian-raw.json — run: node scripts/fetchGuardianBatch.js');
    process.exit(1);
  }

  const raw = JSON.parse(readFileSync(RAW_PATH, 'utf8'));
  const ranked = raw
    .map((item) => ({ item, score: scoreRelevance(item) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  const perCat = Math.ceil(TARGET / 3);
  const byCategory = { Technology: [], Science: [], Nature: [] };
  for (const { item } of ranked) {
    const bucket = byCategory[item.category];
    if (bucket && bucket.length < perCat) bucket.push(item);
  }

  const usable = raw.filter(isUsable).map((item) => ({
    ...item,
    category: inferCategory(item),
  }));
  const rankedUsable = usable
    .map((item) => ({ item, score: scoreRelevance(item) }))
    .sort((a, b) => b.score - a.score);

  const picked = [];
  const seen = new Set();
  const catCount = { Technology: 0, Science: 0, Nature: 0 };

  for (const { item } of rankedUsable) {
    if (picked.length >= TARGET) break;
    if (catCount[item.category] >= perCat) continue;
    picked.push(item);
    seen.add(item.url);
    catCount[item.category] += 1;
  }

  for (const { item } of rankedUsable) {
    if (picked.length >= TARGET) break;
    if (seen.has(item.url)) continue;
    picked.push(item);
    seen.add(item.url);
  }

  const now = Math.floor(Date.now() / 1000);
  const articles = picked.map((item, i) => {
    const syn = synthesizeArticle(item);
    const { for: sf, against: sa, neutral: sn } = syn.stanceDistribution;
    const total = sf + sa + sn;
    const norm = (v) => Math.round((v / total) * 100);

    return {
      id: item.id,
      title: item.title.replace(/\s*\|.*$/, '').trim(),
      category: item.category,
      imageUrl: item.imageUrl,
      article: {
        lede: syn.lede,
        background: syn.background,
        perspectives: syn.perspectives,
        evidence: syn.evidence,
        counterpoint: syn.counterpoint,
        implications: syn.implications,
        conclusion: syn.conclusion,
      },
      sources: [
        {
          title: item.byline || 'The Guardian',
          url: item.url,
          domain: extractDomain(item.url),
        },
      ],
      civility: syn.civility,
      stanceDistribution: {
        for: norm(sf),
        against: norm(sa),
        neutral: 100 - norm(sf) - norm(sa),
      },
      publishedAt: item.publishedAt || now - i * 3600,
      verified: true,
    };
  });

  articles.sort((a, b) => b.publishedAt - a.publishedAt);

  const payload = {
    generatedAt: new Date().toISOString(),
    count: articles.length,
    articles,
    nextCursor: null,
  };

  writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2));
  const counts = articles.reduce((acc, a) => {
    acc[a.category] = (acc[a.category] || 0) + 1;
    return acc;
  }, {});
  console.log(`Wrote ${articles.length} articles → ${OUT_PATH}`);
  console.log('By category:', counts);
}

main();
