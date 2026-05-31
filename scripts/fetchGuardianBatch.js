/**
 * Fetch Guardian articles for seeding (no LLM). Writes scripts/guardian-raw.json
 */
import { createHash } from 'node:crypto';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

function loadDevVars() {
  const path = join(REPO_ROOT, '.dev.vars');
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    if (!process.env[k]) process.env[k] = t.slice(i + 1).trim();
  }
}

/** @type {{ query: string; category: 'Technology' | 'Science' | 'Nature'; subtopic: string }[]} */
const QUERIES = [
  { query: 'artificial intelligence regulation ethics', category: 'Technology', subtopic: 'AI Ethics' },
  { query: 'data privacy surveillance technology', category: 'Technology', subtopic: 'Digital Privacy' },
  { query: 'cybersecurity policy tech', category: 'Technology', subtopic: 'Cybersecurity' },
  { query: 'social media platform regulation', category: 'Technology', subtopic: 'Platforms' },
  { query: 'automation jobs workforce technology', category: 'Technology', subtopic: 'Automation' },
  { query: 'universal basic income technology', category: 'Technology', subtopic: 'UBI' },
  { query: 'four day work week productivity', category: 'Technology', subtopic: 'Work Week' },
  { query: 'space exploration commercial ethics', category: 'Technology', subtopic: 'Space' },
  { query: 'quantum computing research', category: 'Technology', subtopic: 'Quantum' },
  { query: 'electric vehicles battery technology', category: 'Technology', subtopic: 'EVs' },
  { query: 'open source software policy', category: 'Technology', subtopic: 'Open Source' },
  { query: 'biometric identification privacy', category: 'Technology', subtopic: 'Biometrics' },
  { query: 'nuclear energy climate debate', category: 'Science', subtopic: 'Nuclear' },
  { query: 'CRISPR gene editing ethics', category: 'Science', subtopic: 'Genetics' },
  { query: 'climate change research policy', category: 'Science', subtopic: 'Climate Science' },
  { query: 'vaccine public health science', category: 'Science', subtopic: 'Public Health' },
  { query: 'assisted dying euthanasia ethics', category: 'Science', subtopic: 'Bioethics' },
  { query: 'psychedelic therapy research', category: 'Science', subtopic: 'Therapeutics' },
  { query: 'space telescope astronomy discovery', category: 'Science', subtopic: 'Astronomy' },
  { query: 'pandemic preparedness science', category: 'Science', subtopic: 'Epidemiology' },
  { query: 'fusion energy research breakthrough', category: 'Science', subtopic: 'Fusion' },
  { query: 'biodiversity extinction study', category: 'Science', subtopic: 'Ecology' },
  { query: 'microplastics health research', category: 'Science', subtopic: 'Pollution' },
  { query: 'antibiotic resistance research', category: 'Science', subtopic: 'Medicine' },
  { query: 'rewilding urban green space', category: 'Nature', subtopic: 'Rewilding' },
  { query: 'lab grown meat vertical farming', category: 'Nature', subtopic: 'Food Systems' },
  { query: 'deforestation amazon conservation', category: 'Nature', subtopic: 'Forests' },
  { query: 'renewable energy solar wind', category: 'Nature', subtopic: 'Renewables' },
  { query: 'ocean plastic pollution marine', category: 'Nature', subtopic: 'Oceans' },
  { query: 'wildfire climate adaptation', category: 'Nature', subtopic: 'Wildfires' },
  { query: 'water scarcity drought', category: 'Nature', subtopic: 'Water' },
  { query: 'carbon capture climate', category: 'Nature', subtopic: 'Carbon' },
  { query: 'invasive species ecosystem', category: 'Nature', subtopic: 'Invasive Species' },
  { query: 'national park conservation', category: 'Nature', subtopic: 'Parks' },
  { query: 'electric grid renewable transition', category: 'Nature', subtopic: 'Energy Grid' },
  { query: 'sustainable fashion textiles', category: 'Nature', subtopic: 'Fashion' },
  { query: 'bee decline pollinators', category: 'Nature', subtopic: 'Pollinators' },
];

async function fetchQuery({ query, category, subtopic }, apiKey) {
  const params = new URLSearchParams({
    q: query,
    'api-key': apiKey,
    'show-fields': 'bodyText,byline,thumbnail',
    'page-size': '3',
    'order-by': 'newest',
  });
  const res = await fetch(`https://content.guardianapis.com/search?${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${query}`);
  const data = await res.json();
  const results = data?.response?.results ?? [];
  return results
    .filter((r) => r.fields?.bodyText?.trim())
    .map((r) => ({
      id: `art-${createHash('sha256').update(r.webUrl).digest('hex').slice(0, 12)}`,
      title: r.webTitle,
      url: r.webUrl,
      byline: (r.fields?.byline || 'The Guardian').trim(),
      bodyText: r.fields.bodyText,
      imageUrl: r.fields?.thumbnail || null,
      category,
      subtopic,
      publishedAt: r.webPublicationDate
        ? Math.floor(new Date(r.webPublicationDate).getTime() / 1000)
        : Math.floor(Date.now() / 1000),
    }));
}

async function main() {
  loadDevVars();
  const apiKey = process.env.GUARDIAN_API_KEY;
  if (!apiKey) {
    console.error('Missing GUARDIAN_API_KEY in .dev.vars');
    process.exit(1);
  }

  const seen = new Set();
  const articles = [];

  /** Section pulls for better Nature/Science coverage */
  for (const { section, category } of [
    { section: 'science', category: 'Science' },
    { section: 'environment', category: 'Nature' },
    { section: 'technology', category: 'Technology' },
  ]) {
    const params = new URLSearchParams({
      section,
      'api-key': apiKey,
      'show-fields': 'bodyText,byline,thumbnail',
      'page-size': '12',
      'order-by': 'newest',
    });
    try {
      const res = await fetch(`https://content.guardianapis.com/search?${params}`);
      if (!res.ok) continue;
      const data = await res.json();
      for (const r of data?.response?.results ?? []) {
        if (!r.fields?.bodyText?.trim()) continue;
        const url = r.webUrl;
        if (seen.has(url)) continue;
        seen.add(url);
        articles.push({
          id: `art-${createHash('sha256').update(url).digest('hex').slice(0, 12)}`,
          title: r.webTitle,
          url,
          byline: (r.fields?.byline || 'The Guardian').trim(),
          bodyText: r.fields.bodyText,
          imageUrl: r.fields?.thumbnail || null,
          category,
          subtopic: section,
          publishedAt: r.webPublicationDate
            ? Math.floor(new Date(r.webPublicationDate).getTime() / 1000)
            : Math.floor(Date.now() / 1000),
        });
      }
      console.log(`  section:${section} → ${articles.length} total`);
      await new Promise((r) => setTimeout(r, 400));
    } catch (e) {
      console.warn(`  section ${section} skip:`, e.message);
    }
  }

  for (const q of QUERIES) {
    try {
      const batch = await fetchQuery(q, apiKey);
      for (const a of batch) {
        if (seen.has(a.url)) continue;
        seen.add(a.url);
        articles.push(a);
        if (articles.length >= 85) break;
      }
      console.log(`  ${q.subtopic}: +${batch.length} (${articles.length}/85)`);
      if (articles.length >= 85) break;
      await new Promise((r) => setTimeout(r, 400));
    } catch (e) {
      console.warn(`  skip ${q.subtopic}:`, e.message);
    }
  }

  const out = join(__dirname, 'guardian-raw.json');
  const final = articles.slice(0, 85);
  writeFileSync(out, JSON.stringify(final, null, 2));
  console.log(`Wrote ${final.length} articles to ${out}`);
}

main();
