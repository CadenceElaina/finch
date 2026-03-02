/**
 * Stock metadata service — fetches and caches sector, industry, beta, etc.
 * Uses YH Finance profile endpoint with 7-day localStorage caching.
 *
 * Cost: 1 API call per symbol, cached 7 days in localStorage.
 * A portfolio with 5 holdings = 5 calls on first load, then 0 for a week.
 */

import { yhFetch, ENDPOINTS } from "../config/api";
import { isDemoActive } from "../data/demo/demoState";
import { cacheStorage } from "./storage";

// ── Types ────────────────────────────────────────────────

export interface StockMetadata {
  symbol: string;
  sector: string;
  industry: string;
  marketCapRaw: number;
  beta: number;
  dividendYield: number; // raw decimal (0.006 = 0.6%)
  trailingPE: number;
  quoteType: string; // EQUITY, ETF, CRYPTOCURRENCY, INDEX
  exchange: string;
  country: string;
}

// ── Cache config ─────────────────────────────────────────

const METADATA_TTL = 7 * 24 * 60 * 60_000; // 7 days
// Bump version to invalidate all stale cache entries from prior API failures
const CACHE_VERSION = 2;
const cacheKey = (sym: string) => `metadata_v${CACHE_VERSION}_${sym}`;

// ── Demo metadata (approximate Feb 2026 values) ─────────

const DEMO_METADATA: Record<string, Partial<StockMetadata>> = {
  AAPL: {
    sector: "Technology",
    industry: "Consumer Electronics",
    marketCapRaw: 3700e9,
    beta: 1.24,
    dividendYield: 0.0044,
    trailingPE: 31.5,
    quoteType: "EQUITY",
    exchange: "NMS",
    country: "United States",
  },
  MSFT: {
    sector: "Technology",
    industry: "Software—Infrastructure",
    marketCapRaw: 3100e9,
    beta: 0.89,
    dividendYield: 0.0072,
    trailingPE: 35.2,
    quoteType: "EQUITY",
    exchange: "NMS",
    country: "United States",
  },
  GOOGL: {
    sector: "Communication Services",
    industry: "Internet Content & Information",
    marketCapRaw: 2300e9,
    beta: 1.06,
    dividendYield: 0.0049,
    trailingPE: 22.5,
    quoteType: "EQUITY",
    exchange: "NMS",
    country: "United States",
  },
  AMZN: {
    sector: "Consumer Cyclical",
    industry: "Internet Retail",
    marketCapRaw: 2300e9,
    beta: 1.15,
    dividendYield: 0,
    trailingPE: 39.8,
    quoteType: "EQUITY",
    exchange: "NMS",
    country: "United States",
  },
  TSLA: {
    sector: "Consumer Cyclical",
    industry: "Auto Manufacturers",
    marketCapRaw: 1090e9,
    beta: 2.31,
    dividendYield: 0,
    trailingPE: 155.0,
    quoteType: "EQUITY",
    exchange: "NMS",
    country: "United States",
  },
  NVDA: {
    sector: "Technology",
    industry: "Semiconductors",
    marketCapRaw: 3200e9,
    beta: 1.67,
    dividendYield: 0.0003,
    trailingPE: 49.5,
    quoteType: "EQUITY",
    exchange: "NMS",
    country: "United States",
  },
  META: {
    sector: "Communication Services",
    industry: "Internet Content & Information",
    marketCapRaw: 1720e9,
    beta: 1.22,
    dividendYield: 0.0032,
    trailingPE: 26.1,
    quoteType: "EQUITY",
    exchange: "NMS",
    country: "United States",
  },
  JPM: {
    sector: "Financial Services",
    industry: "Banks—Diversified",
    marketCapRaw: 740e9,
    beta: 1.08,
    dividendYield: 0.019,
    trailingPE: 13.8,
    quoteType: "EQUITY",
    exchange: "NYQ",
    country: "United States",
  },
  V: {
    sector: "Financial Services",
    industry: "Credit Services",
    marketCapRaw: 650e9,
    beta: 0.94,
    dividendYield: 0.0068,
    trailingPE: 32.4,
    quoteType: "EQUITY",
    exchange: "NYQ",
    country: "United States",
  },
  WMT: {
    sector: "Consumer Defensive",
    industry: "Discount Stores",
    marketCapRaw: 790e9,
    beta: 0.52,
    dividendYield: 0.0087,
    trailingPE: 40.2,
    quoteType: "EQUITY",
    exchange: "NYQ",
    country: "United States",
  },
  AMD: {
    sector: "Technology",
    industry: "Semiconductors",
    marketCapRaw: 184e9,
    beta: 1.71,
    dividendYield: 0,
    trailingPE: 102.5,
    quoteType: "EQUITY",
    exchange: "NMS",
    country: "United States",
  },
  NFLX: {
    sector: "Communication Services",
    industry: "Entertainment",
    marketCapRaw: 440e9,
    beta: 1.31,
    dividendYield: 0,
    trailingPE: 50.8,
    quoteType: "EQUITY",
    exchange: "NMS",
    country: "United States",
  },
  CRM: {
    sector: "Technology",
    industry: "Software—Application",
    marketCapRaw: 300e9,
    beta: 1.19,
    dividendYield: 0.0053,
    trailingPE: 47.2,
    quoteType: "EQUITY",
    exchange: "NYQ",
    country: "United States",
  },
  INTC: {
    sector: "Technology",
    industry: "Semiconductors",
    marketCapRaw: 105e9,
    beta: 1.05,
    dividendYield: 0.0204,
    trailingPE: 0,
    quoteType: "EQUITY",
    exchange: "NMS",
    country: "United States",
  },
  BA: {
    sector: "Industrials",
    industry: "Aerospace & Defense",
    marketCapRaw: 140e9,
    beta: 1.42,
    dividendYield: 0,
    trailingPE: 0,
    quoteType: "EQUITY",
    exchange: "NYQ",
    country: "United States",
  },
  UBER: {
    sector: "Technology",
    industry: "Software—Application",
    marketCapRaw: 152e9,
    beta: 1.38,
    dividendYield: 0,
    trailingPE: 30.5,
    quoteType: "EQUITY",
    exchange: "NYQ",
    country: "United States",
  },
  SHOP: {
    sector: "Technology",
    industry: "Software—Application",
    marketCapRaw: 153e9,
    beta: 2.2,
    dividendYield: 0,
    trailingPE: 68.4,
    quoteType: "EQUITY",
    exchange: "NYQ",
    country: "Canada",
  },
  COST: {
    sector: "Consumer Defensive",
    industry: "Discount Stores",
    marketCapRaw: 446e9,
    beta: 0.78,
    dividendYield: 0.0047,
    trailingPE: 56.3,
    quoteType: "EQUITY",
    exchange: "NMS",
    country: "United States",
  },
  SPY: {
    sector: "N/A",
    industry: "N/A",
    marketCapRaw: 0,
    beta: 1.0,
    dividendYield: 0.012,
    trailingPE: 0,
    quoteType: "ETF",
    exchange: "PCX",
    country: "United States",
  },
  // ── Common ETFs (fallback when YH Finance quota is exhausted) ──
  SCHG: {
    sector: "N/A",
    industry: "Large Cap Growth ETF",
    marketCapRaw: 0,
    beta: 1.05,
    dividendYield: 0.003,
    trailingPE: 0,
    quoteType: "ETF",
    exchange: "PCX",
    country: "United States",
  },
  CGGR: {
    sector: "N/A",
    industry: "Growth ETF",
    marketCapRaw: 0,
    beta: 1.02,
    dividendYield: 0.004,
    trailingPE: 0,
    quoteType: "ETF",
    exchange: "PCX",
    country: "United States",
  },
  IAU: {
    sector: "N/A",
    industry: "Gold Trust",
    marketCapRaw: 0,
    beta: 0.08,
    dividendYield: 0,
    trailingPE: 0,
    quoteType: "ETF",
    exchange: "PCX",
    country: "United States",
  },
  VB: {
    sector: "N/A",
    industry: "Small Cap ETF",
    marketCapRaw: 0,
    beta: 1.15,
    dividendYield: 0.013,
    trailingPE: 0,
    quoteType: "ETF",
    exchange: "PCX",
    country: "United States",
  },
  VO: {
    sector: "N/A",
    industry: "Mid Cap ETF",
    marketCapRaw: 0,
    beta: 1.05,
    dividendYield: 0.013,
    trailingPE: 0,
    quoteType: "ETF",
    exchange: "PCX",
    country: "United States",
  },
  VXUS: {
    sector: "N/A",
    industry: "International ETF",
    marketCapRaw: 0,
    beta: 0.85,
    dividendYield: 0.028,
    trailingPE: 0,
    quoteType: "ETF",
    exchange: "PCX",
    country: "United States",
  },
  VTI: {
    sector: "N/A",
    industry: "Total Market ETF",
    marketCapRaw: 0,
    beta: 1.0,
    dividendYield: 0.013,
    trailingPE: 0,
    quoteType: "ETF",
    exchange: "PCX",
    country: "United States",
  },
  QQQ: {
    sector: "N/A",
    industry: "NASDAQ 100 ETF",
    marketCapRaw: 0,
    beta: 1.18,
    dividendYield: 0.005,
    trailingPE: 0,
    quoteType: "ETF",
    exchange: "NMS",
    country: "United States",
  },
  VOO: {
    sector: "N/A",
    industry: "S&P 500 ETF",
    marketCapRaw: 0,
    beta: 1.0,
    dividendYield: 0.012,
    trailingPE: 0,
    quoteType: "ETF",
    exchange: "PCX",
    country: "United States",
  },
  AGG: {
    sector: "N/A",
    industry: "Bond Aggregate ETF",
    marketCapRaw: 0,
    beta: 0.03,
    dividendYield: 0.035,
    trailingPE: 0,
    quoteType: "ETF",
    exchange: "PCX",
    country: "United States",
  },
  BND: {
    sector: "N/A",
    industry: "Total Bond ETF",
    marketCapRaw: 0,
    beta: 0.03,
    dividendYield: 0.033,
    trailingPE: 0,
    quoteType: "ETF",
    exchange: "NMS",
    country: "United States",
  },
  IWM: {
    sector: "N/A",
    industry: "Russell 2000 ETF",
    marketCapRaw: 0,
    beta: 1.18,
    dividendYield: 0.012,
    trailingPE: 0,
    quoteType: "ETF",
    exchange: "PCX",
    country: "United States",
  },
  VEA: {
    sector: "N/A",
    industry: "Developed Markets ETF",
    marketCapRaw: 0,
    beta: 0.82,
    dividendYield: 0.029,
    trailingPE: 0,
    quoteType: "ETF",
    exchange: "PCX",
    country: "United States",
  },
  VWO: {
    sector: "N/A",
    industry: "Emerging Markets ETF",
    marketCapRaw: 0,
    beta: 0.88,
    dividendYield: 0.032,
    trailingPE: 0,
    quoteType: "ETF",
    exchange: "PCX",
    country: "United States",
  },
  "BTC-USD": {
    sector: "Cryptocurrency",
    industry: "Cryptocurrency",
    marketCapRaw: 1670e9,
    beta: 0,
    dividendYield: 0,
    trailingPE: 0,
    quoteType: "CRYPTOCURRENCY",
    exchange: "CCC",
    country: "",
  },
  "ETH-USD": {
    sector: "Cryptocurrency",
    industry: "Cryptocurrency",
    marketCapRaw: 276e9,
    beta: 0,
    dividendYield: 0,
    trailingPE: 0,
    quoteType: "CRYPTOCURRENCY",
    exchange: "CCC",
    country: "",
  },
  "SOL-USD": {
    sector: "Cryptocurrency",
    industry: "Cryptocurrency",
    marketCapRaw: 73e9,
    beta: 0,
    dividendYield: 0,
    trailingPE: 0,
    quoteType: "CRYPTOCURRENCY",
    exchange: "CCC",
    country: "",
  },
};

// ── Public API ───────────────────────────────────────────

/**
 * Fetch metadata for a single symbol. Checks localStorage cache first (7-day TTL).
 * Falls back to demo data or defaults on failure.
 */
export async function getStockMetadata(
  symbol: string
): Promise<StockMetadata> {
  const sym = symbol.toUpperCase();

  // Demo mode: return hardcoded data immediately
  if (isDemoActive()) {
    return buildMeta(sym, DEMO_METADATA[sym] ?? {});
  }

  // Check localStorage cache (7-day TTL, versioned key)
  const cached = cacheStorage.get<StockMetadata>(
    cacheKey(sym),
    METADATA_TTL
  );
  if (cached) return cached;

  // Fetch from YH Finance profile endpoint
  try {
    const res = await yhFetch(ENDPOINTS.profile.path, {
      symbol: sym,
      region: "US",
    });

    const d = res.data ?? {};
    const r0 = d.quoteSummary?.result?.[0] ?? {};
    const profile =
      r0.assetProfile ?? d.summaryProfile ?? d.assetProfile ?? {};
    const keyStats =
      r0.defaultKeyStatistics ?? d.defaultKeyStatistics ?? {};
    const sumDetail = r0.summaryDetail ?? d.summaryDetail ?? {};
    const price = r0.price ?? d.price ?? {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawVal = (v: any): number =>
      v?.raw !== undefined ? v.raw : typeof v === "number" ? v : 0;

    const meta = buildMeta(sym, {
      sector: profile.sector,
      industry: profile.industry,
      marketCapRaw:
        rawVal(price.marketCap) || rawVal(sumDetail.marketCap),
      beta: rawVal(keyStats.beta),
      dividendYield: rawVal(sumDetail.dividendYield),
      trailingPE:
        rawVal(sumDetail.trailingPE) || rawVal(price.trailingPE),
      quoteType: price.quoteType ?? sumDetail.quoteType ?? "",
      exchange: price.exchange ?? "",
      country: profile.country ?? "",
    });

    cacheStorage.set(cacheKey(sym), meta);
    return meta;
  } catch {
    // Fallback to demo data if available, else generic defaults
    return buildMeta(sym, DEMO_METADATA[sym] ?? {});
  }
}

/**
 * Fetch metadata for multiple symbols in parallel.
 * Individual results are cached — subsequent calls are cheap.
 */
export async function getBatchStockMetadata(
  symbols: string[]
): Promise<Record<string, StockMetadata>> {
  const result: Record<string, StockMetadata> = {};
  await Promise.allSettled(
    symbols.map(async (sym) => {
      result[sym.toUpperCase()] = await getStockMetadata(sym);
    })
  );
  return result;
}

// ── Helpers ──────────────────────────────────────────────

function buildMeta(
  symbol: string,
  partial: Partial<StockMetadata>
): StockMetadata {
  return {
    symbol,
    sector: partial.sector || "Unknown",
    industry: partial.industry || "Unknown",
    marketCapRaw: partial.marketCapRaw ?? 0,
    beta: partial.beta ?? 0,
    dividendYield: partial.dividendYield ?? 0,
    trailingPE: partial.trailingPE ?? 0,
    quoteType: partial.quoteType || "EQUITY",
    exchange: partial.exchange || "",
    country: partial.country || "United States",
  };
}

/** Classify market cap into tiers */
export function classifyMarketCap(mc: number): string {
  if (mc >= 200e9) return "Mega Cap";
  if (mc >= 10e9) return "Large Cap";
  if (mc >= 2e9) return "Mid Cap";
  if (mc >= 300e6) return "Small Cap";
  if (mc > 0) return "Micro Cap";
  return "Unknown";
}

/** Classify country into geography bucket */
export function classifyGeography(country: string): string {
  if (!country) return "Unknown";
  if (country === "United States") return "US";
  const developed = [
    "United Kingdom",
    "Germany",
    "France",
    "Japan",
    "Canada",
    "Australia",
    "Switzerland",
    "Netherlands",
    "Sweden",
    "Spain",
    "Italy",
    "Ireland",
    "Singapore",
    "Hong Kong",
    "Israel",
    "South Korea",
    "New Zealand",
    "Finland",
    "Denmark",
    "Norway",
    "Belgium",
    "Austria",
  ];
  if (developed.includes(country)) return "Developed Intl";
  return "Emerging Markets";
}

/** Classify quoteType into readable asset type */
export function classifyAssetType(quoteType: string): string {
  switch (quoteType?.toUpperCase()) {
    case "EQUITY":
      return "Stocks";
    case "ETF":
      return "ETFs";
    case "CRYPTOCURRENCY":
      return "Crypto";
    case "MUTUALFUND":
      return "Mutual Funds";
    case "INDEX":
      return "Indexes";
    default:
      return "Other";
  }
}
