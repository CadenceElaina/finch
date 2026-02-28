/**
 * Finch — Seeking Alpha API Configuration
 * ----------------------------------------
 * Single source of truth for Seeking Alpha endpoints via RapidAPI.
 *
 * Provider : Seeking Alpha via RapidAPI
 * Host     : seeking-alpha.p.rapidapi.com
 * Tier     : Free (Basic)
 *
 * HARD LIMITS (free tier)
 * ─────────────────────────────────────────────────────────
 * • 500 requests per month (hard limit)
 * • 500,000 MB bandwidth per month
 *
 * With only 500 calls/month we MUST cache aggressively and
 * avoid unnecessary requests.
 */

// ── API keys & host ──────────────────────────────────────

export const SA_API_HOST = "seeking-alpha.p.rapidapi.com";

export const SA_API_KEY = (
  import.meta.env.VITE_YH_FINANCE_KEY ??
  import.meta.env.VITE_APIDOJO_YAHOO_KEY ??
  ""
) as string;

export const saHeaders = () => ({
  "x-rapidapi-host": SA_API_HOST,
  "x-rapidapi-key": SA_API_KEY,
  "Content-Type": "application/json",
});

export const SA_BASE = `https://${SA_API_HOST}`;

// ── Proxy-aware fetch helper ─────────────────────────────

import axios from "axios";

/**
 * Make a GET request to a Seeking Alpha endpoint, routing through
 * the Vercel Edge proxy in production.
 */
export async function saFetch(
  endpoint: string,
  params: Record<string, string | number> = {}
) {
  if (import.meta.env.PROD) {
    return axios.get("/api/seeking-alpha", {
      params: { endpoint, ...params },
    });
  }
  return axios.get(`${SA_BASE}${endpoint}`, {
    params,
    headers: saHeaders(),
  });
}

// ── Endpoints ────────────────────────────────────────────

export const SA_ENDPOINTS = {
  /** Realtime quotes for multiple tickers (by sa_id) */
  realtimeQuotes: "/market/get-realtime-quotes",
  /** Autocomplete / symbol search */
  autoComplete: "/v2/auto-complete",
  /** General market news */
  newsList: "/news/v2/list",
  /** News by symbol */
  newsBySymbol: "/news/v2/list-by-symbol",
  /** Trending news */
  newsTrending: "/news/v2/list-trending",
  /** Historical price chart */
  chart: "/symbols/get-chart",
  /** Symbol summary (company info) */
  symbolSummary: "/symbols/get-summary",
  /** Symbol profile */
  symbolProfile: "/symbols/get-profile",
} as const;

// ── SA ID Lookup ─────────────────────────────────────────
//
// Seeking Alpha's quote endpoint requires numeric `sa_ids`,
// not ticker symbols. We hardcode common ones to avoid
// wasting API calls on autocomplete lookups.
//
// To find an sa_id for a new ticker:
//   GET /v2/auto-complete?query=AAPL&type=symbols&size=1
//   → response.symbols[0].id
//
// The keys here use the DISPLAY symbols the app uses
// (Yahoo-style like "^DJI" for compatibility with existing code).

export const SA_ID_MAP: Record<string, number> = {
  // ── US Indexes ──
  "^DJI": 598187,    // Dow Jones Industrial Average
  "^GSPC": 603998,   // S&P 500 (SPX)
  "^IXIC": 590019,   // NASDAQ Composite (COMP:IND)
  "^RUT": 604614,    // Russell 2000 (RUT:IND) — estimated, may need verification
  "^VIX": 604615,    // CBOE Volatility Index — estimated, may need verification

  // ── Popular US Stocks ──
  AAPL: 146,
  TSLA: 16123,
  MSFT: 2135,
  GOOGL: 544,
  AMZN: 457,
  META: 583986,
  NVDA: 4698,
  AMD: 478,
  NFLX: 870,
  JPM: 1209,
  V: 12328,
  DIS: 591,
  BA: 498,
  INTC: 831,
  WMT: 2173,
  KO: 817,
  PEP: 1563,
  JNJ: 866,
  PFE: 1576,
  UNH: 2057,
  HD: 750,
  COST: 578,
  ABBV: 514561,
  MRK: 1388,
  CRM: 4752,
  ORCL: 1530,
  CSCO: 567,
  ADBE: 451,
  QCOM: 1686,
  TXN: 1999,
  PYPL: 529498,
  SQ: 529750,
  SHOP: 531125,
  UBER: 582762,
  SNAP: 531254,
  SPOT: 558755,
  ROKU: 541785,

  // ── European Indexes ──
  // "^GDAXI": ???,  // DAX — needs lookup
  // "^FTSE": ???,   // FTSE 100 — needs lookup

  // ── Crypto ──
  "BTC-USD": 581294,  // Bitcoin USD
  "ETH-USD": 581295,  // Ethereum USD
};

/**
 * Look up the sa_id for a given display symbol.
 * Returns the hardcoded ID if known, or undefined if not found.
 */
export function getSaId(symbol: string): number | undefined {
  // Try exact match first
  if (SA_ID_MAP[symbol] !== undefined) return SA_ID_MAP[symbol];
  // Try uppercase
  if (SA_ID_MAP[symbol.toUpperCase()] !== undefined)
    return SA_ID_MAP[symbol.toUpperCase()];
  return undefined;
}
