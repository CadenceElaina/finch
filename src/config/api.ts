/**
 * Finch — Yahoo Finance 166 API Configuration & Cache Policy
 * -------------------------------------------------------
 * Single source of truth for API endpoints, rate limits, cache TTLs,
 * and refresh strategies. Import from here instead of scattering magic
 * numbers across components.
 *
 * Provider : Yahoo Finance 166 via RapidAPI
 * Host     : yahoo-finance166.p.rapidapi.com
 * Tier     : Free (Basic)
 *
 * HARD LIMITS (free tier)
 * ─────────────────────────────────────────────────────────
 * • 500 requests per calendar month (hard cap)
 * • No per-minute / per-window sub-limits documented
 *
 * Combined with Seeking Alpha (500/month) → 1,000 total.
 * Budget: ~16 calls/day if spread evenly.
 * Batching + caching is essential.
 */

// ── API keys & host ──────────────────────────────────────

export const YH_API_HOST = "yahoo-finance166.p.rapidapi.com";

// Key is read from env at runtime (Vite injects it)
// Falls back to the old apidojo key since it's the same RapidAPI account
export const YH_API_KEY = (
  import.meta.env.VITE_YH_FINANCE_KEY ??
  import.meta.env.VITE_APIDOJO_YAHOO_KEY ??
  ""
) as string;

export const yhHeaders = () => ({
  "x-rapidapi-host": YH_API_HOST,
  "x-rapidapi-key": YH_API_KEY,
});

// ── Proxy-aware fetch helper ─────────────────────────────
//
// In production (Vercel): calls /api/yh-finance?endpoint=...
//   → Edge Function adds the API key server-side.
// In development: calls RapidAPI directly with the key from .env.

import axios from "axios";

/**
 * Make a GET request to a YH Finance endpoint, routing through
 * the Vercel Edge proxy in production.
 *
 * @param endpoint - The YH Finance path, e.g. "/market/v2/get-quotes"
 * @param params   - Query parameters (region, symbols, etc.)
 * @returns The axios response
 */
export async function yhFetch(
  endpoint: string,
  params: Record<string, string | number> = {}
) {
  if (import.meta.env.PROD) {
    // Production: route through /api/yh-finance Edge Function
    return axios.get("/api/yh-finance", {
      params: { endpoint, ...params },
    });
  }
  // Development: call RapidAPI directly
  return axios.get(`https://${YH_API_HOST}${endpoint}`, {
    params,
    headers: yhHeaders(),
  });
}

// ── Rate limits ──────────────────────────────────────────

export const RATE_LIMITS = {
  /** Hard monthly cap (free tier) */
  monthlyHardCap: 500,
  /** Our self-imposed daily budget to stay safe (~16/day) */
  dailyBudget: 16,
} as const;

// ── Endpoints we actually use (MVP) ─────────────────────
//
// Keeping this lean on purpose. Each entry documents what
// feature uses it and how we cache it.
//
// Legend for `cache`:
//   stale  = TanStack Query staleTime (component won't refetch while fresh)
//   gc     = TanStack Query gcTime (data removed from memory after this)
//   ls     = localStorage TTL (persisted across sessions, checked on read)

export const ENDPOINTS = {
  /**
   * Batch stock/index quotes (snapshots)
   * Used by: Homepage hero, IndexCards, MarketIndexes, Watchlists,
   *          Portfolios, MostFollowed, Gainers/Losers/Active
   * Path:  GET /api/market/get-quote?symbols=AAPL,MSFT,^DJI
   * Notes: Comma-separated symbols (supports ^DJI style index tickers).
   *        Up to ~50 symbols per call. This is our PRIMARY query endpoint.
   */
  batchQuotes: {
    path: "/api/market/get-quote",
    params: { region: "US" },
    cache: { stale: 30_000, gc: 5 * 60_000 }, // 30 s stale, 5 min gc
  },

  /**
   * Auto-complete / search
   * Used by: Search bar
   * Path:  GET /api/autocomplete?query=micro&region=US
   */
  search: {
    path: "/api/autocomplete",
    params: { region: "US" },
    cache: { stale: 15 * 60_000, gc: 30 * 60_000 },
  },

  /**
   * Stock chart / price history
   * Used by: QuoteChart (1D / 5D / 1M / 6M / YTD / 1Y / 5Y)
   * Path:  GET /api/stock/get-chart?interval=1d&symbol=AAPL&range=1y&region=US
   * Params: interval (1m|5m|15m|1d|1wk|1mo), range (1d|5d|1mo|6mo|ytd|1y|5y|max)
   */
  history: {
    path: "/api/stock/get-chart",
    params: { region: "US" },
    cache: {
      stale: 5 * 60_000,
      gc: 30 * 60_000,
    },
  },

  /**
   * Market movers — gainers
   * Used by: MarketTrends "Gainers" tab
   * Path:  GET /api/market/get-day-gainers?region=US&count=25
   */
  moversGainers: {
    path: "/api/market/get-day-gainers",
    params: { region: "US", language: "en-US", count: 25, offset: 0 },
    cache: { stale: 60_000, gc: 5 * 60_000 },
  },

  /**
   * Market movers — losers
   * Used by: MarketTrends "Losers" tab
   * Path:  GET /api/market/get-day-losers?region=US&count=25
   */
  moversLosers: {
    path: "/api/market/get-day-losers",
    params: { region: "US", language: "en-US", count: 25, offset: 0 },
    cache: { stale: 60_000, gc: 5 * 60_000 },
  },

  /**
   * Market movers — most active
   * Used by: MarketTrends "Most Active" tab
   * Path:  GET /api/market/get-most-actives?region=US&count=25
   */
  moversActive: {
    path: "/api/market/get-most-actives",
    params: { region: "US", language: "en-US", count: 25, offset: 0 },
    cache: { stale: 60_000, gc: 5 * 60_000 },
  },

  /**
   * Kept for backward compat — routes to gainers by default.
   * Legacy code that references ENDPOINTS.movers will still work.
   */
  movers: {
    path: "/api/market/get-day-gainers",
    params: { region: "US", language: "en-US", count: 25, offset: 0 },
    cache: { stale: 60_000, gc: 5 * 60_000 },
  },

  /**
   * Stock profile / financial data
   * Used by: Quote page
   * Path:  GET /api/stock/get-financial-data?symbol=AAPL&region=US
   */
  profile: {
    path: "/api/stock/get-financial-data",
    params: { region: "US" },
    cache: {
      stale: 60 * 60_000,
      gc: 2 * 60 * 60_000,
      ls: 24 * 60 * 60_000,
    },
  },

  /**
   * Stock statistics (key stats, valuation, profile)
   * Used by: Quote page sidebar
   * Path:  GET /api/stock/get-statistics?symbol=AAPL&region=US
   */
  statistics: {
    path: "/api/stock/get-statistics",
    params: { region: "US" },
    cache: {
      stale: 60 * 60_000,
      gc: 2 * 60 * 60_000,
      ls: 24 * 60 * 60_000,
    },
  },

  /**
   * Trending tickers
   * Used by: MarketTrends "Trending" tab
   * Path:  GET /api/market/get-trending?region=US
   */
  trending: {
    path: "/api/market/get-trending",
    params: { region: "US", language: "en-US", quote_type: "ALL" },
    cache: { stale: 60_000, gc: 5 * 60_000 },
  },

  /**
   * Analyst upgrade/downgrade history
   * Used by: Quote page (new feature)
   * Path:  GET /api/stock/get-upgrade-downgrade-history?symbol=AAPL&region=US
   */
  upgradeDowngrade: {
    path: "/api/stock/get-upgrade-downgrade-history",
    params: { region: "US" },
    cache: {
      stale: 60 * 60_000,
      gc: 2 * 60 * 60_000,
    },
  },

  /**
   * World indices — for all global market indices
   * Used by: Markets component (Europe, Asia tabs)
   * Path:  GET /api/market/get-world-indices?region=US
   */
  worldIndices: {
    path: "/api/market/get-world-indices",
    params: { region: "US", language: "en-US" },
    cache: { stale: 60_000, gc: 5 * 60_000 },
  },

  /**
   * Market summary — US indexes with spark data
   * Used by: Markets component (US tab)
   * Path:  GET /api/market/get-market-summary?market_region=US
   */
  marketSummary: {
    path: "/api/market/get-market-summary",
    params: { market_region: "US" },
    cache: { stale: 60_000, gc: 5 * 60_000 },
  },

  /**
   * Company outlook summary
   * Used by: Quote page about section
   * Path:  GET /api/stock/get-company-outlook-summary?symbol=AAPL&region=US
   */
  companyOutlook: {
    path: "/api/stock/get-company-outlook-summary",
    params: { region: "US" },
    cache: {
      stale: 60 * 60_000,
      gc: 2 * 60 * 60_000,
      ls: 24 * 60 * 60_000,
    },
  },
} as const;

// ── Site-wide cache & refresh policy ─────────────────────
//
// These rules apply globally — if ANY user (or the cron job)
// already fetched data for a symbol, every other visitor gets
// the cached version until it expires.
//
// In Phase 2+ this cache lives in Vercel KV (server-side).
// For now (Phase 0-1) it lives in TanStack Query + localStorage.

export const CACHE_POLICY = {
  /**
   * How often we allow a NEW API call for the same symbol.
   * This is the minimum interval between live fetches, site-wide.
   *
   * Rationale: Stock prices update every few seconds during market
   * hours, but we don't need real-time. 30 seconds is fast enough
   * for a portfolio tracker and keeps us well under rate limits.
   *
   * Outside market hours this effectively becomes "once" since
   * prices don't change.
   */
  symbolRefreshInterval: 30_000, // 30 seconds during market hours

  /**
   * Modules / fundamentals (financials, profile, statistics).
   * These update quarterly at most. Fetch once per day max.
   */
  modulesRefreshInterval: 24 * 60 * 60_000, // 24 hours

  /**
   * News per symbol. We don't need more than every 10 minutes.
   */
  newsRefreshInterval: 10 * 60_000, // 10 minutes

  /**
   * Market-wide data (indexes, trending, gainers/losers).
   * Refreshed by the cron job and on-demand every 60 s.
   */
  marketRefreshInterval: 60_000, // 60 seconds

  /**
   * Calendar events (earnings dates). Daily data — once per day.
   */
  calendarRefreshInterval: 24 * 60 * 60_000, // 24 hours
} as const;

// ── Morning batch job (future) ───────────────────────────
//
// Phase 3+ work. With 500 calls/month we can't afford a cron
// job yet. Documenting for when we upgrade to a paid tier.

export const CRON_SCHEDULE = {
  expression: "0 13 * * 1-5",
  estimatedCalls: 5,
  warmKeys: [
    "batchQuotes:indexes",
    "movers",
    "trending",
  ],
} as const;

// ── Helpers ──────────────────────────────────────────────

/** Returns true if US markets are currently open (rough check). */
export function isMarketOpen(): boolean {
  const now = new Date();
  const eastern = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  const day = eastern.getDay(); // 0=Sun, 6=Sat
  const hours = eastern.getHours();
  const minutes = eastern.getMinutes();
  const time = hours * 60 + minutes;

  // Mon–Fri, 9:30 AM – 4:00 PM ET
  return day >= 1 && day <= 5 && time >= 570 && time < 960;
}

/**
 * Returns the appropriate refresh interval for a symbol quote.
 * During market hours: 30s. Outside: effectively never (24h).
 */
export function getQuoteRefreshInterval(): number {
  return isMarketOpen()
    ? CACHE_POLICY.symbolRefreshInterval
    : 24 * 60 * 60_000;
}

/**
 * Build a localStorage cache key with a TTL check.
 * Returns null if expired or missing.
 */
export function readCachedModule<T>(symbol: string, module: string): T | null {
  const key = `finch_module_${symbol}_${module}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as { data: T; ts: number };
    if (Date.now() - ts > CACHE_POLICY.modulesRefreshInterval) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function writeCachedModule<T>(
  symbol: string,
  module: string,
  data: T
): void {
  const key = `finch_module_${symbol}_${module}`;
  localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
}
