/**
 * Returns true if `side` is the rich object shape (with .arguments array),
 * false if it is the legacy string[] shape.
 */
export function isRichSide(side) {
  return side && typeof side === 'object' && !Array.isArray(side) && 'arguments' in side
}

const EMPTY_SIDE = {
  stakeholders: '',
  core_values: '',
  arguments: [],
  strongest_objection: '',
  notable_examples: '',
}

/**
 * Normalises any bothSides.for / bothSides.against value into the rich object shape.
 * If passed a string[], wraps each string as { heading: '', detail: string }.
 * If passed the rich object, returns it unchanged.
 * If passed null/undefined, returns a safe empty stub.
 */
export function normaliseSide(side) {
  if (!side) return { ...EMPTY_SIDE }

  if (isRichSide(side)) return side

  if (Array.isArray(side)) {
    return {
      ...EMPTY_SIDE,
      arguments: side.map((s) => ({ heading: '', detail: String(s) })),
    }
  }

  return { ...EMPTY_SIDE }
}

/**
 * Returns a display-friendly summary of stakeholders for use in card subtitles.
 * Falls back to '' for legacy data.
 */
export function getStakeholderSummary(side) {
  if (isRichSide(side) && side.stakeholders) {
    return side.stakeholders
  }
  return ''
}
