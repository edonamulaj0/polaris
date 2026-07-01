/**
 * Detect attempts to bypass profanity filters using asterisks or similar masking.
 * Returns matched pattern description if bypass detected, null otherwise.
 */
export function detectMaskingBypass(text: string): string | null {
  const patterns: { regex: RegExp; label: string }[] = [
    { regex: /\b\w*\*+\w*\b/i, label: 'asterisk masking' },
    { regex: /\b\w*[\u2022\u00b7]+\w*\b/i, label: 'bullet masking' },
    { regex: /\bf[\*\-_\.]+k\b/i, label: 'masked profanity (fk)' },
    { regex: /\bs[\*\-_\.]+t\b/i, label: 'masked profanity (st)' },
    { regex: /\bsh[\*\-_\.]+t\b/i, label: 'masked profanity (sh*t)' },
    { regex: /\ba[\*\-_\.]+s[\*\-_\.]+s\b/i, label: 'masked profanity (ass)' },
    { regex: /\bb[\*\-_\.]+t[\*\-_\.]+ch\b/i, label: 'masked profanity (btch)' },
    { regex: /\bf[\*\-_\.@#]+[\*\-_\.@#]*u[\*\-_\.@#]*c[\*\-_\.@#]*k/i, label: 'masked profanity' },
  ];

  for (const { regex, label } of patterns) {
    if (regex.test(text)) {
      return `Bypassed filter via ${label}`;
    }
  }
  return null;
}
