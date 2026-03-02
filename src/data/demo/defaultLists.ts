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

// ── Helpers ──────────────────────────────────────────────

const id = () => crypto.randomUUID();

/** Generate synthetic daily portfolio values between two dates. */
function synthHistory(
  startDate: string,
  startValue: number,
  endValue: number
): Array<{ date: string; value: number }> {
  const start = new Date(startDate);
  const end = new Date();
  const days: Array<{ date: string; value: number }> = [];
  const totalDays = Math.round(
    (end.getTime() - start.getTime()) / 86_400_000
  );
  if (totalDays <= 0) return [{ date: startDate, value: startValue }];

  // Simple growth curve with slight noise
  const growthRate = (endValue - startValue) / totalDays;
  let seed = startValue * 7 + totalDays; // deterministic seed
  const rand = () => {
    seed = (seed * 16807 + 0) % 2147483647;
    return ((seed - 1) / 2147483646 - 0.5) * 2; // -1 to 1
  };

  for (let d = 0; d <= totalDays; d++) {
    const date = new Date(start);
    date.setDate(date.getDate() + d);
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue; // skip weekends

    const baseValue = startValue + growthRate * d;
    const noise = baseValue * 0.003 * rand(); // ±0.3% daily noise
    const value = Math.max(0, Number((baseValue + noise).toFixed(2)));

    days.push({
      date: date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
      value,
    });
  }

  return days;
}

// ── Portfolio 1: Core ETF Portfolio ──────────────────────

const ETF_PORTFOLIO_ID = id();

const etfPortfolio: Portfolio = {
  id: ETF_PORTFOLIO_ID,
  title: "Core ETFs",
  author: undefined,
  isDemo: true,
  securities: [
    {
      symbol: "schg",
      quantity: 120,
      purchasePrice: 25.4,
      purchaseDate: "2024-03-15",
    },
    {
      symbol: "vo",
      quantity: 25,
      purchasePrice: 215.8,
      purchaseDate: "2024-03-15",
    },
    {
      symbol: "vb",
      quantity: 20,
      purchasePrice: 198.5,
      purchaseDate: "2024-06-10",
    },
    {
      symbol: "vxus",
      quantity: 80,
      purchasePrice: 54.2,
      purchaseDate: "2024-03-15",
    },
    {
      symbol: "bnd",
      quantity: 30,
      purchasePrice: 72.1,
      purchaseDate: "2024-03-15",
    },
  ],
  portfolioValue: synthHistory("2024-03-15", 14250, 17800),
};

// ── Portfolio 2: Aggressive Growth + BTC ─────────────────

const GROWTH_PORTFOLIO_ID = id();

const growthPortfolio: Portfolio = {
  id: GROWTH_PORTFOLIO_ID,
  title: "Growth & Crypto",
  author: undefined,
  isDemo: true,
  securities: [
    {
      symbol: "nvda",
      quantity: 30,
      purchasePrice: 48.5,
      purchaseDate: "2023-01-20",
    },
    {
      symbol: "tsla",
      quantity: 15,
      purchasePrice: 180.0,
      purchaseDate: "2023-06-12",
    },
    {
      symbol: "amzn",
      quantity: 20,
      purchasePrice: 128.0,
      purchaseDate: "2023-03-01",
    },
    {
      symbol: "meta",
      quantity: 12,
      purchasePrice: 210.0,
      purchaseDate: "2023-04-15",
    },
    {
      symbol: "amd",
      quantity: 40,
      purchasePrice: 95.0,
      purchaseDate: "2023-07-01",
    },
    {
      symbol: "crm",
      quantity: 18,
      purchasePrice: 165.0,
      purchaseDate: "2023-09-15",
    },
    {
      symbol: "shop",
      quantity: 25,
      purchasePrice: 52.0,
      purchaseDate: "2023-05-20",
    },
    {
      symbol: "btc-usd",
      quantity: 0.5,
      purchasePrice: 29000.0,
      purchaseDate: "2023-08-01",
    },
  ],
  portfolioValue: synthHistory("2023-01-20", 28500, 68000),
};

// ── Portfolio 3: Dividend & Blue Chip ────────────────────

const DIVIDEND_PORTFOLIO_ID = id();

const dividendPortfolio: Portfolio = {
  id: DIVIDEND_PORTFOLIO_ID,
  title: "Dividends & Value",
  author: undefined,
  isDemo: true,
  securities: [
    {
      symbol: "jnj",
      quantity: 30,
      purchasePrice: 155.0,
      purchaseDate: "2024-01-10",
    },
    {
      symbol: "ko",
      quantity: 60,
      purchasePrice: 58.5,
      purchaseDate: "2024-01-10",
    },
    {
      symbol: "pep",
      quantity: 20,
      purchasePrice: 168.0,
      purchaseDate: "2024-02-15",
    },
    {
      symbol: "jpm",
      quantity: 15,
      purchasePrice: 172.0,
      purchaseDate: "2024-01-10",
    },
    {
      symbol: "wmt",
      quantity: 25,
      purchasePrice: 162.0,
      purchaseDate: "2024-03-01",
    },
    {
      symbol: "hd",
      quantity: 10,
      purchasePrice: 345.0,
      purchaseDate: "2024-04-20",
    },
    {
      symbol: "abbv",
      quantity: 20,
      purchasePrice: 162.0,
      purchaseDate: "2024-02-15",
    },
    {
      symbol: "mrk",
      quantity: 25,
      purchasePrice: 120.0,
      purchaseDate: "2024-05-01",
    },
  ],
  portfolioValue: synthHistory("2024-01-10", 42000, 48500),
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
  { symbol: "SQ" },
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
