/**
 * ETF Holdings / Sector Breakdown Service
 * ────────────────────────────────────────
 * Uses Seeking Alpha `GET /symbols/get-holdings` to fetch sector-level
 * breakdown for ETFs. This endpoint is batch-capable (comma-separated
 * symbols) so one call covers the entire portfolio.
 *
 * Data is cached in localStorage for 7 days.
 *
 * Cost: 1 SA API call per batch (all ETFs in portfolio).
 */

import { saFetch } from "../config/seekingAlphaApi";
import { isDemoActive } from "../data/demo/demoState";
import { cacheStorage } from "./storage";

// ── Types ────────────────────────────────────────────────

export interface EtfSectorBreakdown {
  stockHoldings: Record<string, number>; // sector key → weight %
  bondHoldings?: Record<string, number>; // bond/cash key → weight %
}

// ── Cache config ─────────────────────────────────────────

const ETF_HOLDINGS_TTL = 7 * 24 * 60 * 60_000; // 7 days

// ── Demo data (from real SA API responses, Feb 2026) ─────

const DEMO_ETF_SECTORS: Record<string, EtfSectorBreakdown> = {
  SCHG: {
    stockHoldings: {
      basicMaterials: 1.34,
      consumerCyclical: 13.22,
      financials: 7.38,
      realEstate: 0.41,
      consumerDefensive: 1.74,
      healthcare: 8.74,
      utilities: 0.41,
      communication: 16.57,
      energy: 0.63,
      industrials: 5.89,
      technology: 43.62,
    },
    bondHoldings: {
      government: 0.02,
      derivative: 0.03,
      cashAndEquiv: 0.02,
    },
  },
  CGGR: {
    // Capital Group Growth ETF — growth-oriented large cap
    stockHoldings: {
      technology: 35.2,
      consumerCyclical: 15.8,
      communication: 14.1,
      healthcare: 12.5,
      financials: 8.3,
      industrials: 7.6,
      consumerDefensive: 3.2,
      energy: 1.8,
      basicMaterials: 0.9,
      utilities: 0.3,
      realEstate: 0.2,
    },
    bondHoldings: {
      cashAndEquiv: 0.1,
    },
  },
  VXUS: {
    stockHoldings: {
      basicMaterials: 7.75,
      consumerCyclical: 9.29,
      financials: 22.46,
      realEstate: 2.35,
      consumerDefensive: 5.40,
      healthcare: 7.42,
      utilities: 3.08,
      communication: 4.64,
      energy: 4.15,
      industrials: 15.33,
      technology: 14.64,
    },
    bondHoldings: {
      derivative: 0.12,
      cashAndEquiv: 0.53,
    },
  },
  VO: {
    stockHoldings: {
      basicMaterials: 5.16,
      consumerCyclical: 11.16,
      financials: 15.20,
      realEstate: 5.36,
      consumerDefensive: 4.14,
      healthcare: 8.52,
      utilities: 8.15,
      communication: 3.37,
      energy: 7.10,
      industrials: 17.56,
      technology: 13.53,
    },
    bondHoldings: {
      derivative: 0.17,
      cashAndEquiv: 0.01,
    },
  },
  VB: {
    stockHoldings: {
      basicMaterials: 5.75,
      consumerCyclical: 10.48,
      financials: 13.76,
      realEstate: 6.46,
      consumerDefensive: 3.67,
      healthcare: 11.69,
      utilities: 3.23,
      communication: 3.14,
      energy: 3.81,
      industrials: 21.39,
      technology: 15.13,
    },
    bondHoldings: {
      derivative: 0.0,
      cashAndEquiv: -0.01,
    },
  },
  IAU: {
    // iShares Gold Trust — no stock holdings, pure commodity
    stockHoldings: {},
    bondHoldings: {},
  },
  BND: {
    // Vanguard Total Bond Market ETF — nearly 100% fixed income
    stockHoldings: {},
    bondHoldings: {
      government: 46.0,
      corporate: 27.5,
      securitized: 21.5,
      cashAndEquiv: 5.0,
    },
  },
  AGG: {
    // iShares Core US Aggregate Bond ETF — similar to BND
    stockHoldings: {},
    bondHoldings: {
      government: 43.0,
      corporate: 28.0,
      securitized: 24.0,
      cashAndEquiv: 5.0,
    },
  },
  SPY: {
    stockHoldings: {
      technology: 31.5,
      financials: 13.2,
      healthcare: 12.8,
      consumerCyclical: 10.5,
      communication: 8.9,
      industrials: 8.6,
      consumerDefensive: 6.1,
      energy: 3.5,
      utilities: 2.4,
      realEstate: 2.2,
      basicMaterials: 2.1,
    },
    bondHoldings: {
      cashAndEquiv: 0.1,
    },
  },
  VTI: {
    stockHoldings: {
      technology: 30.8,
      financials: 13.5,
      healthcare: 12.5,
      consumerCyclical: 10.8,
      communication: 8.7,
      industrials: 8.9,
      consumerDefensive: 6.0,
      energy: 3.6,
      utilities: 2.5,
      realEstate: 2.3,
      basicMaterials: 2.2,
    },
    bondHoldings: {
      cashAndEquiv: 0.1,
    },
  },
  QQQ: {
    stockHoldings: {
      technology: 51.2,
      communication: 16.4,
      consumerCyclical: 13.1,
      healthcare: 6.8,
      consumerDefensive: 4.5,
      industrials: 4.3,
      financials: 1.1,
      utilities: 1.4,
      energy: 0.5,
      basicMaterials: 0.4,
      realEstate: 0.2,
    },
    bondHoldings: {
      cashAndEquiv: 0.1,
    },
  },
};

// ── Public API ───────────────────────────────────────────

/**
 * Fetch sector breakdown for a batch of ETF symbols.
 * Returns a map keyed by uppercase symbol.
 *
 * Checks localStorage cache first (7-day TTL per symbol).
 * In demo mode returns hardcoded data immediately.
 */
export async function getEtfSectorBreakdowns(
  symbols: string[]
): Promise<Record<string, EtfSectorBreakdown>> {
  const result: Record<string, EtfSectorBreakdown> = {};
  if (symbols.length === 0) return result;

  // Demo mode
  if (isDemoActive()) {
    for (const sym of symbols) {
      const s = sym.toUpperCase();
      if (DEMO_ETF_SECTORS[s]) result[s] = DEMO_ETF_SECTORS[s];
    }
    return result;
  }

  // Check cache first, collect uncached symbols
  const uncached: string[] = [];
  for (const sym of symbols) {
    const s = sym.toUpperCase();
    const cached = cacheStorage.get<EtfSectorBreakdown>(
      `etf_sectors_${s}`,
      ETF_HOLDINGS_TTL
    );
    if (cached) {
      result[s] = cached;
    } else {
      uncached.push(s);
    }
  }

  if (uncached.length === 0) return result;

  // Fetch from SA API (batch — comma-separated)
  try {
    const res = await saFetch("/symbols/get-holdings", {
      symbols: uncached.join(",").toLowerCase(),
    });

    const data = res.data?.data ?? res.data ?? [];
    if (Array.isArray(data)) {
      for (const item of data) {
        const sym = (item.id ?? "").toUpperCase();
        const attrs = item.attributes ?? {};
        const breakdown: EtfSectorBreakdown = {
          stockHoldings: attrs.stockHoldings ?? {},
          bondHoldings: attrs.bondHoldings ?? {},
        };
        result[sym] = breakdown;
        cacheStorage.set(`etf_sectors_${sym}`, breakdown);
      }
    }
  } catch {
    // Non-critical — sector tab will just show "Unknown" for missing ETFs
    console.warn("[etfHoldings] Failed to fetch SA holdings data");
  }

  return result;
}
