/**
 * [REFACTOR 3.1] Post-build guard — fail CI if secret patterns appear in dist/.
 * Run automatically via npm postbuild.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const DIST = 'dist'
const EXT = new Set(['.js', '.css', '.html', '.json', '.map', '.svg'])
const PATTERNS = [
  { re: /sk-ant/i, label: 'Anthropic API key (sk-ant)' },
  { re: /VITE_ANTHROPIC_API_KEY/, label: 'VITE_ANTHROPIC_API_KEY env reference' },
  { re: /ANTHROPIC_API_KEY/, label: 'ANTHROPIC_API_KEY string' },
]

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) {
      walk(path, out)
    } else if (EXT.has(extname(name))) {
      out.push(path)
    }
  }
  return out
}

function main() {
  let files
  try {
    files = walk(DIST)
  } catch {
    console.error(`verify:bundle — ${DIST}/ not found. Run vite build first.`)
    process.exit(1)
  }

  const hits = []
  for (const file of files) {
    const text = readFileSync(file, 'utf8')
    for (const { re, label } of PATTERNS) {
      if (re.test(text)) hits.push({ file, label })
    }
  }

  if (hits.length) {
    console.error('SECRETS IN BUNDLE — FAIL')
    for (const h of hits) console.error(`  ${h.label}: ${h.file}`)
    process.exit(1)
  }

  console.log('verify:bundle — PASS (no secret patterns in dist/)')
}

main()
