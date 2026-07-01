import { CURATED_DEBATES, getCuratedDebate } from '../data/curatedDebates'

/** ISO week number (1–53) for rotating weekly featured debate. */
function isoWeekNumber(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

/** Pick one curated debate per calendar week (cycles through all 50). */
export function getWeeklyDebate(date = new Date()) {
  if (!CURATED_DEBATES.length) return null
  const week = isoWeekNumber(date)
  const index = (week - 1) % CURATED_DEBATES.length
  return CURATED_DEBATES[index]
}

export function getWeeklyDebateLabel(date = new Date()) {
  const debate = getWeeklyDebate(date)
  if (!debate) return null
  const week = isoWeekNumber(date)
  return {
    debate,
    weekLabel: `Week ${week}`,
    headline: 'Weekly Controversial Debate',
  }
}

export { getCuratedDebate, CURATED_DEBATES }
