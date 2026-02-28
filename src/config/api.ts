/**
 * Finch — YH Finance API Configuration & Cache Policy
 * -------------------------------------------------------
 * Single source of truth for API endpoints, rate limits, cache TTLs,
 * and refresh strategies. Import from here instead of scattering magic
 * numbers across components.
 *
 * Provider : YH Finance via RapidAPI
 * Host     : yh-finance.p.rapidapi.com
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

export const YH_API_HOST = "yh-finance.p.rapidapi.com";

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
   * Path:  GET /market/v2/get-quotes?region=US&symbols=AAPL,MSFT,^DJI
   * Notes: Comma-separated symbols (supports ^DJI style index tickers).
   *        Up to ~50 symbols per call. This is our PRIMARY query endpoint.
   */
  batchQuotes: {
    path: "/market/v2/get-quotes",
    params: { region: "US" },
    cache: { stale: 30_000, gc: 5 * 60_000 }, // 30 s stale, 5 min gc
  },

  /**
   * Auto-complete / search
   * Used by: Search bar
   * Path:  GET /auto-complete?q=micro&region=US
   */
  search: {
    path: "/auto-complete",
    params: { region: "US" },
    cache: { stale: 15 * 60_000, gc: 30 * 60_000 },
  },

  /**
   * Stock chart / price history
   * Used by: QuoteChart (1D / 5D / 1M / 6M / YTD / 1Y / 5Y)
   * Path:  GET /stock/v3/get-chart?interval=1d&symbol=AAPL&range=1y&region=US
   * Params: interval (1m|5m|15m|1d|1wk|1mo), range (1d|5d|1mo|6mo|ytd|1y|5y|max)
   */
  history: {
    path: "/stock/v3/get-chart",
    params: { region: "US" },
    cache: {
      stale: 5 * 60_000,
      gc: 30 * 60_000,
    },
  },

  /**
   * Market movers — gainers, losers, most-active in one call
   * Used by: MarketTrends tabs (Gainers/Losers/MostActive)
   * Path:  GET /market/v2/get-movers?region=US&lang=en-US&count=25&start=0
   * Notes: Returns gainers + losers + most-active all in one response.
   */
  movers: {
    path: "/market/v2/get-movers",
    params: { region: "US", lang: "en-US", count: 25, start: 0 },
    cache: { stale: 60_000, gc: 5 * 60_000 },
  },

  /**
   * Stock profile (summary, financials)
   * Used by: Quote page
   * Path:  GET /stock/v3/get-profile?symbol=AAPL&region=US
   */
  profile: {
    path: "/stock/v3/get-profile",
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
   * Path:  GET /market/get-trending-tickers?region=US
   */
  trending: {
    path: "/market/get-trending-tickers",
    params: { region: "US" },
    cache: { stale: 60_000, gc: 5 * 60_000 },
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
