/**
 * Default portfolios & watchlist — seeded on first visit.
 *
 * These give new users (and recruiters) something to see immediately
 * without needing to manually add holdings. These are written to
 * localStorage once and then the user owns the data.
 *
 * Portfolio value history is synthetically generated so the
 * performance chart has data from day one.
 */

import { Portfolio, Watchlist, WatchlistSecurity } from "../../types/types";
import type { DemoSecurity } from "./calibrate";

/**
 * Seeded demo holdings carry a `costRatio` that is resolved against the live
 * price at seed time (see calibrate.ts). The extra field is confined to this
 * module so the app-wide Security type stays free of demo concerns.
 */
type DemoPortfolio = Omit<Portfolio, "securities"> & {
  securities: DemoSecurity[];
};

// ── Helpers ──────────────────────────────────────────────

const id = () => crypto.randomUUID();

/**
 * Generate synthetic daily portfolio values between two dates.
 *
 * Walks a deterministic geometric random walk (realistic day-to-day
 * volatility, so the path actually dips and recovers) rather than a fixed
 * growth rate plus a sliver of noise — the old ±0.3%-of-value jitter was
 * tiny next to the linear trend, so every seeded portfolio rendered as a
 * near-straight ramp with no drawdowns, which doesn't read as real market
 * history. The per-step drift is solved for after the walk is drawn so the
 * path still lands exactly on `endValue`.
 */
function synthHistory(
  startDate: string,
  startValue: number,
  endValue: number
): Array<{ date: string; value: number }> {
  const start = new Date(startDate);
  const end = new Date();
  const totalDays = Math.round(
    (end.getTime() - start.getTime()) / 86_400_000
  );
  if (totalDays <= 0) return [{ date: startDate, value: startValue }];

  const tradingDates: Date[] = [];
  for (let d = 0; d <= totalDays; d++) {
    const date = new Date(start);
    date.setDate(date.getDate() + d);
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue; // skip weekends
    tradingDates.push(date);
  }
  if (tradingDates.length <= 1) {
    return [{ date: startDate, value: startValue }];
  }

  let seed = startValue * 7 + totalDays; // deterministic seed
  const rand = () => {
    seed = (seed * 16807 + 0) % 2147483647;
    return ((seed - 1) / 2147483646 - 0.5) * 2; // -1 to 1
  };
  // Sum of two uniforms approximates a bell curve, so single-day spikes are
  // rare but plausible up/down swings (rather than a uniform sawtooth) show
  // up along the path.
  const gaussianish = () => (rand() + rand()) / 2;

  const dailyVol = 0.011; // ~1.1% daily stdev, in line with a diversified equity portfolio
  const steps = tradingDates.length - 1;
  const cumLogReturns = [0];
  let cumLog = 0;
  for (let i = 1; i <= steps; i++) {
    cumLog += gaussianish() * dailyVol;
    cumLogReturns.push(cumLog);
  }

  // Distribute the drift needed to land exactly on endValue evenly across
  // every step, on top of the random walk drawn above.
  const targetLog = Math.log(Math.max(endValue, 0.01) / startValue);
  const driftPerStep = (targetLog - cumLog) / steps;

  return tradingDates.map((date, i) => {
    const value = Math.max(
      0,
      Number(
        (startValue * Math.exp(cumLogReturns[i] + driftPerStep * i)).toFixed(2)
      )
    );
    return {
      date: date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
      value,
    };
  });
}

// ── Portfolio 1: Core ETF Portfolio ──────────────────────

const ETF_PORTFOLIO_ID = id();

const etfPortfolio: DemoPortfolio = {
  id: ETF_PORTFOLIO_ID,
  title: "Core ETFs",
  author: undefined,
  isDemo: true,
  securities: [
    {
      symbol: "schg",
      quantity: 120,
      purchasePrice: 25.4,
      costRatio: 0.72,
      purchaseDate: "2024-03-15",
    },
    {
      symbol: "vo",
      quantity: 25,
      purchasePrice: 215.8,
      costRatio: 0.88,
      purchaseDate: "2024-03-15",
    },
    {
      symbol: "vb",
      quantity: 20,
      purchasePrice: 198.5,
      costRatio: 0.85,
      purchaseDate: "2024-06-10",
    },
    {
      symbol: "vxus",
      quantity: 80,
      purchasePrice: 54.2,
      costRatio: 0.91,
      purchaseDate: "2024-03-15",
    },
    {
      symbol: "bnd",
      quantity: 30,
      purchasePrice: 72.1,
      costRatio: 1.02,
      purchaseDate: "2024-03-15",
    },
  ],
  portfolioValue: synthHistory("2024-03-15", 18900, 20900),
};

// ── Portfolio 2: Aggressive Growth + BTC ─────────────────

const GROWTH_PORTFOLIO_ID = id();

const growthPortfolio: DemoPortfolio = {
  id: GROWTH_PORTFOLIO_ID,
  title: "Growth & Crypto",
  author: undefined,
  isDemo: true,
  securities: [
    {
      symbol: "nvda",
      quantity: 30,
      purchasePrice: 48.5,
      costRatio: 0.35,
      purchaseDate: "2023-01-20",
    },
    {
      symbol: "tsla",
      quantity: 15,
      purchasePrice: 180.0,
      costRatio: 1.12,
      purchaseDate: "2023-06-12",
    },
    {
      symbol: "amzn",
      quantity: 20,
      purchasePrice: 128.0,
      costRatio: 0.62,
      purchaseDate: "2023-03-01",
    },
    {
      symbol: "meta",
      quantity: 12,
      purchasePrice: 210.0,
      costRatio: 0.48,
      purchaseDate: "2023-04-15",
    },
    {
      symbol: "amd",
      quantity: 40,
      purchasePrice: 95.0,
      costRatio: 0.95,
      purchaseDate: "2023-07-01",
    },
    {
      symbol: "crm",
      quantity: 18,
      purchasePrice: 165.0,
      costRatio: 1.05,
      purchaseDate: "2023-09-15",
    },
    {
      symbol: "shop",
      quantity: 25,
      purchasePrice: 52.0,
      costRatio: 0.55,
      purchaseDate: "2023-05-20",
    },
    {
      symbol: "btc-usd",
      quantity: 0.5,
      purchasePrice: 29000.0,
      costRatio: 0.45,
      purchaseDate: "2023-08-01",
    },
  ],
  portfolioValue: synthHistory("2023-01-20", 31800, 76650),
};

// ── Portfolio 3: Dividend & Blue Chip ────────────────────

const DIVIDEND_PORTFOLIO_ID = id();

const dividendPortfolio: DemoPortfolio = {
  id: DIVIDEND_PORTFOLIO_ID,
  title: "Dividends & Value",
  author: undefined,
  isDemo: true,
  securities: [
    {
      symbol: "jnj",
      quantity: 30,
      purchasePrice: 155.0,
      costRatio: 0.88,
      purchaseDate: "2024-01-10",
    },
    {
      symbol: "ko",
      quantity: 60,
      purchasePrice: 58.5,
      costRatio: 0.92,
      purchaseDate: "2024-01-10",
    },
    {
      symbol: "pep",
      quantity: 20,
      purchasePrice: 168.0,
      costRatio: 1.04,
      purchaseDate: "2024-02-15",
    },
    {
      symbol: "jpm",
      quantity: 15,
      purchasePrice: 172.0,
      costRatio: 0.74,
      purchaseDate: "2024-01-10",
    },
    {
      symbol: "wmt",
      quantity: 25,
      purchasePrice: 162.0,
      costRatio: 0.68,
      purchaseDate: "2024-03-01",
    },
    {
      symbol: "hd",
      quantity: 10,
      purchasePrice: 345.0,
      costRatio: 0.97,
      purchaseDate: "2024-04-20",
    },
    {
      symbol: "abbv",
      quantity: 20,
      purchasePrice: 162.0,
      costRatio: 0.79,
      purchaseDate: "2024-02-15",
    },
    {
      symbol: "mrk",
      quantity: 25,
      purchasePrice: 120.0,
      costRatio: 1.08,
      purchaseDate: "2024-05-01",
    },
  ],
  portfolioValue: synthHistory("2024-01-10", 27840, 28240),
};

// ── Default Watchlist ────────────────────────────────────

const WATCHLIST_ID = id();

const watchlistSymbols: WatchlistSecurity[] = [
  // US mega-cap
  { symbol: "AAPL" },
  { symbol: "MSFT" },
  { symbol: "GOOGL" },
  { symbol: "AMZN" },
  { symbol: "NVDA" },
  { symbol: "META" },
  { symbol: "TSLA" },
  // US large-cap
  { symbol: "V" },
  { symbol: "UNH" },
  { symbol: "JPM" },
  { symbol: "HD" },
  { symbol: "COST" },
  { symbol: "NFLX" },
  // US growth / mid-cap
  { symbol: "CRM" },
  { symbol: "AMD" },
  { symbol: "UBER" },
  { symbol: "SHOP" },
  // Block Inc. moved from SQ to XYZ; SQ no longer resolves upstream.
  { symbol: "XYZ" },
  // US value / defensive
  { symbol: "KO" },
  { symbol: "JNJ" },
  { symbol: "PFE" },
  // ETFs
  { symbol: "SPY" },
  { symbol: "QQQ" },
  { symbol: "VXUS" },
  // Crypto
  { symbol: "BTC-USD" },
  { symbol: "ETH-USD" },
];

const defaultWatchlist: Watchlist = {
  id: WATCHLIST_ID,
  title: "Market Watch",
  author: undefined,
  isDemo: true,
  securities: watchlistSymbols,
};

// ── Exports ──────────────────────────────────────────────

export const DEFAULT_PORTFOLIOS: Portfolio[] = [
  etfPortfolio,
  growthPortfolio,
  dividendPortfolio,
];

export const DEFAULT_WATCHLISTS: Watchlist[] = [defaultWatchlist];

// ── Seed version ─────────────────────────────────────────
// Bump this number whenever DEFAULT_PORTFOLIOS / DEFAULT_WATCHLISTS change
// so the context migration code (v2 check) runs for existing users.
// v3 replaced fixture-era absolute purchase prices with costRatio, which is
// resolved against live quotes at seed time.
export const DEMO_SEED_VERSION = 3;

/** Watchlist defaults have no migrations yet; kept explicit so the restore
 *  path can't drift from the seeding path the way the portfolio one did. */
export const DEMO_WATCHLIST_SEED_VERSION = 1;

// ── Change-detection helpers ──────────────────────────────
// Returns true if the stored demo item differs from its original defaults
// (securities added/removed, or title changed).

export function isDemoPortfolioModified(stored: Portfolio): boolean {
  if (!stored.isDemo) return false;
  const original = DEFAULT_PORTFOLIOS.find((d) => d.id === stored.id || d.title === stored.title);
  if (!original) return false;
  const origSet = new Set(original.securities?.map((s) => s.symbol.toLowerCase()) ?? []);
  const currSet = new Set((stored.securities ?? []).map((s) => s.symbol.toLowerCase()));
  if (stored.title !== original.title) return true;
  if (origSet.size !== currSet.size) return true;
  for (const s of origSet) if (!currSet.has(s)) return true;
  return false;
}

export function isDemoWatchlistModified(stored: Watchlist): boolean {
  if (!stored.isDemo) return false;
  const original = DEFAULT_WATCHLISTS.find((d) => d.id === stored.id || d.title === stored.title);
  if (!original) return false;
  const origSet = new Set(original.securities?.map((s) => s.symbol.toLowerCase()) ?? []);
  const currSet = new Set((stored.securities ?? []).map((s) => s.symbol.toLowerCase()));
  if (stored.title !== original.title) return true;
  if (origSet.size !== currSet.size) return true;
  for (const s of origSet) if (!currSet.has(s)) return true;
  return false;
}
