// Parsing and checking of typed numeric answers.

/**
 * Parse a typed number. Accepts "1.5", "1,5", "+6", "-2", "6.02e23", "6.02E23", "6.02 × 10^23", "6.02x10^23",
 * "6.02*10^23", "6.02·10²³" and a trailing unit ("3 L", "88 g"). Returns null when no number is found.
 */
export function parseNumber(input: string): number | null {
  const SUP: Record<string, string> = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '+' };
  let s = input.trim().replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]/g, (c) => SUP[c] ?? c);
  s = s.replace(/\u2212/g, '-'); // unicode minus
  s = s.replace(/(\d),(\d)/g, '$1.$2'); // decimal comma
  s = s.replace(/\s+/g, ' ');
  const sci = /^([+-]?\d*\.?\d+)\s*(?:[x×*·]\s*10\s*\^?\s*([+-]?\d+))/i.exec(s);
  if (sci) return Number(sci[1]) * Math.pow(10, Number(sci[2]));
  const plain = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)/i.exec(s);
  if (!plain) return null;
  const n = Number(plain[1]);
  return Number.isFinite(n) ? n : null;
}

export interface Tolerance {
  /** Relative tolerance (fraction of the answer), default 2%. */
  rel?: number;
  /** Absolute tolerance, default 1e-9 (used when the answer is 0 or very small). */
  abs?: number;
}

export function isNumericAnswerCorrect(input: string, answer: number, tol: Tolerance = {}): boolean {
  const n = parseNumber(input);
  if (n === null) return false;
  const rel = tol.rel ?? 0.02;
  const abs = tol.abs ?? 1e-9;
  return Math.abs(n - answer) <= Math.max(abs, Math.abs(answer) * rel);
}

/** Format a number for feedback: up to 3 significant decimals, scientific notation for very large/small values. */
export function formatAnswer(n: number): string {
  if (n === 0) return '0';
  const a = Math.abs(n);
  if (a >= 1e6 || a < 1e-3) {
    const [mant, exp] = n.toExponential(3).split('e');
    return `${Number(mant)} × 10^${Number(exp)}`;
  }
  return String(Number(n.toPrecision(4)));
}
