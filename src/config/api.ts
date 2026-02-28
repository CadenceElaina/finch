/**
 * Finch — Yahoo Finance API Configuration & Cache Policy
 * -------------------------------------------------------
 * Single source of truth for API endpoints, rate limits, cache TTLs,
 * and refresh strategies. Import from here instead of scattering magic
 * numbers across components.
 *
 * Provider : Yahoo Finance 15 via RapidAPI
 * Host     : yahoo-finance15.p.rapidapi.com
 * Tier     : Free (Basic)
 *
 * HARD LIMITS (free tier)
 * ─────────────────────────────────────────────────────────
 * • 750 requests per ~30 min reset window (most endpoints)
 * • 500 requests per ~30 min reset window (news endpoints)
 * • 500,000 requests per calendar month (hard cap, all endpoints)
 *
 * If we average ~550 calls/day we stay under 17 k/month — well within
 * the 500 k ceiling. The 750/30 min window is the real constraint
 * during peak usage; batching + caching keeps us safe.
 */

// ── API keys & host ──────────────────────────────────────

export const YH_API_HOST = "yahoo-finance15.p.rapidapi.com";

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
  /** Requests allowed per reset window (most endpoints) */
  perWindow: 750,
  /** Requests allowed per reset window (news endpoints) */
  perWindowNews: 500,
  /** Approximate reset window in seconds (~30 min) */
  windowSeconds: 1800,
  /** Hard monthly cap (free tier) */
  monthlyHardCap: 500_000,
  /** Our self-imposed daily budget to stay safe */
  dailyBudget: 550,
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
   * Market summary — S&P 500, DJIA, NASDAQ, etc.
   * Used by: Homepage hero, IndexCards, MarketIndexes
   * Path:  GET /api/v1/markets/quote?type=MARKET
   * Notes: Returns ~30 index quotes. One call covers entire homepage.
   */
  marketSummary: {
    path: "/api/v1/markets/quote",
    params: { type: "MARKET" },
    cache: { stale: 60_000, gc: 5 * 60_000 }, // 1 min stale, 5 min gc
  },

  /**
   * Batch stock quotes (snapshots)
   * Used by: Watchlists, Portfolios, MostFollowed, Gainers/Losers/Active
   * Path:  GET /api/v1/markets/quote?ticker=MSFT,AAPL,GOOG
   * Notes: Comma-separated tickers. Max ~50 per call recommended.
   *        This is our primary batching endpoint — one call per list.
   */
  batchQuotes: {
    path: "/api/v1/markets/quote",
    // params.ticker set at call time
    cache: { stale: 30_000, gc: 5 * 60_000 }, // 30 s stale, 5 min gc
  },

  /**
   * Single stock quote (same endpoint, one ticker)
   * Used by: Quote page header, search preview
   * Path:  GET /api/v1/markets/quote?ticker=MSFT
   */
  singleQuote: {
    path: "/api/v1/markets/quote",
    cache: { stale: 30_000, gc: 15 * 60_000 }, // 30 s stale, 15 min gc
  },

  /**
   * Stock chart / price history
   * Used by: QuoteChart (1D / 5D / 1M / 6M / YTD / 1Y / 5Y)
   * Path:  GET /api/v2/markets/tickers/history?ticker=MSFT&type=HISTORICAL
   * Params: interval (5m | 15m | 1d | 1wk | 1mo), diffandsplits (false)
   * Notes: Intraday intervals (5m/15m) only go back ~5 days.
   *        Daily/weekly/monthly go back years.
   */
  history: {
    path: "/api/v2/markets/tickers/history",
    cache: {
      stale: 5 * 60_000, // 5 min stale (chart doesn't need to be live)
      gc: 30 * 60_000, // 30 min gc
    },
  },

  /**
   * Auto-complete / search
   * Used by: Search bar
   * Path:  GET /api/v1/markets/search?search=micro
   */
  search: {
    path: "/api/v1/markets/search",
    cache: { stale: 15 * 60_000, gc: 30 * 60_000 }, // search results are stable
  },

  /**
   * Stock modules — rich detail for a single symbol
   * Used by: Quote page tabs (Summary, Financials, Profile, etc.)
   * Path:  GET /api/v1/markets/stock/modules?ticker=MSFT&module=<name>
   *
   * Modules we use:
   *   asset-profile       → Company description, sector, industry, website
   *   financial-data       → Revenue, margins, EPS, target price
   *   default-key-statistics → Market cap, PE, beta, 52-wk range
   *   earnings             → Quarterly EPS actual vs estimate
   *   income-statement     → Annual / quarterly income statements
   *   balance-sheet        → Annual / quarterly balance sheets
   *   cashflow-statement   → Annual / quarterly cash flows
   *   recommendation-trend → Analyst buy/hold/sell counts
   *
   * These are mostly static — financials update quarterly, profile rarely.
   * Cache aggressively in localStorage.
   */
  modules: {
    path: "/api/v1/markets/stock/modules",
    cache: {
      stale: 60 * 60_000, // 1 hour stale in memory
      gc: 2 * 60 * 60_000, // 2 hour gc
      ls: 24 * 60 * 60_000, // 24 hour localStorage TTL
    },
  },

  /**
   * News — general market or per-symbol
   * Used by: Homepage news feed, Quote page news tab
   * Path:  GET /api/v2/markets/news?tickers=MSFT&type=ALL
   * Notes: Separate rate limit (500/window). Cache longer.
   */
  news: {
    path: "/api/v2/markets/news",
    cache: { stale: 10 * 60_000, gc: 30 * 60_000 }, // 10 min stale
  },

  /**
   * Trending tickers
   * Used by: MarketTrends "Trending" tab
   * Path:  GET /api/v1/markets/trending?type=MOST_WATCHED (or MOST_ACTIVE, GAINERS, LOSERS)
   */
  trending: {
    path: "/api/v1/markets/trending",
    cache: { stale: 60_000, gc: 5 * 60_000 }, // 1 min stale
  },

  /**
   * Calendar events — earnings, dividends, splits
   * Used by: Homepage "Upcoming Earnings" / earnings calendar
   * Path:  GET /api/v1/markets/calendar/events?type=EARNINGS&from=2026-02-28&to=2026-03-07
   */
  calendarEvents: {
    path: "/api/v1/markets/calendar/events",
    cache: { stale: 60 * 60_000, gc: 2 * 60 * 60_000 }, // 1 hr stale (daily data)
  },

  /**
   * Stock earnings history
   * Used by: Quote page earnings chart (EPS actual vs estimate)
   * Path:  GET /api/v1/markets/stock/modules?ticker=MSFT&module=earnings
   * (same modules endpoint, listed separately for clarity)
   */
  earnings: {
    path: "/api/v1/markets/stock/modules",
    module: "earnings",
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

// ── Morning batch job (Vercel Cron) ──────────────────────
//
// Runs at 9:00 AM ET (13:00 UTC) weekdays, ~30 min before
// US market open. Pre-warms the cache so the first visitor
// of the day sees instant data.
//
// Estimated calls per run: ~8-12
//   1  marketSummary       (indexes)
//   1  trending GAINERS    (pre-market movers)
//   1  trending LOSERS
//   1  trending MOST_ACTIVE
//   1  trending MOST_WATCHED
//   1  calendarEvents      (today's earnings)
//   1  news (general)
//   ~3 batchQuotes          (popular symbols from watchlists)
//
// This is Phase 3+ work. Documenting now for budget planning.

export const CRON_SCHEDULE = {
  /** Cron expression: 9:00 AM ET (13:00 UTC), Mon–Fri */
  expression: "0 13 * * 1-5",
  /** Estimated API calls per run */
  estimatedCalls: 10,
  /** Pre-warm these query keys in cache */
  warmKeys: [
    "marketSummary",
    "trending:GAINERS",
    "trending:LOSERS",
    "trending:MOST_ACTIVE",
    "trending:MOST_WATCHED",
    "calendarEvents",
    "news:general",
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
