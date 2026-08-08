/**
 * Ticker display helpers.
 *
 * Symbols arrive from several sources with inconsistent casing (demo lists
 * store "nvda", the default market-watch list stores "NVDA", APIs vary), so
 * everything user-facing is normalized through here.
 */

/** Stable string hash → non-negative integer. */
const hashStr = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

/**
 * Display form of a ticker: uppercase, with any quote suffix dropped
 * ("btc-usd" → "BTC").
 */
export function displaySymbol(symbol: string | null | undefined): string {
  if (!symbol) return "";
  return symbol.split("-")[0].toUpperCase();
}

/**
 * Full uppercase ticker, suffix preserved ("btc-usd" → "BTC-USD").
 * Use where the symbol identifies the instrument rather than labels it.
 */
export function normalizeSymbol(symbol: string | null | undefined): string {
  if (!symbol) return "";
  return symbol.toUpperCase();
}

/**
 * Pick the better of the two names a quote carries.
 *
 * Yahoo truncates `shortName` to 31 characters, which cuts mid-word and reads
 * as a real (if odd) name rather than as elision — "Vanguard Total
 * International Stock Index Fund ETF Shares" arrives as "Vanguard Total
 * International St". Preferring `longName` keeps the name complete and lets
 * the UI ellipsize it honestly when space runs out.
 */
export function preferredName(
  longName?: string | null,
  shortName?: string | null,
  fallback = ""
): string {
  const long = longName?.trim();
  const short = shortName?.trim();
  return long || short || fallback;
}

/**
 * Deterministic hue (0-359) for a ticker badge.
 *
 * Returns only a hue — the badge's background and text lightness are resolved
 * in CSS per theme, so contrast holds in both light and dark mode. Previously
 * this was `getRandomColor()`, which re-rolled on every render and could
 * produce unreadable pairings.
 *
 * Hues are spread with a golden-angle step so adjacent symbols in a list are
 * visually distinct rather than clustering in one part of the wheel.
 */
export function tickerHue(symbol: string | null | undefined): number {
  if (!symbol) return 210;
  return Math.round(hashStr(symbol.toUpperCase()) * 137.508) % 360;
}
