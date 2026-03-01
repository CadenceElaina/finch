/**
 * Build the Context Bundle sent to Gemini with every prompt.
 * Contains real-time market data so the AI can make informed responses.
 */

import { quoteType } from "../components/search/types";
import { Portfolio } from "../types/types";
import { isMarketOpen } from "../config/api";

export interface ContextBundle {
  timestamp: string;
  marketStatus: "OPEN" | "CLOSED";
  indices?: Record<string, number>;
  topMovers?: { gainers: string[]; losers: string[] };
  headlines?: string[];
  userWatchlist?: string[];
  userPortfolioSummary?: {
    totalValue: number;
    dayChangePercent: string;
    holdings: string[];
  };
}

/**
 * Build a context bundle from available app state.
 * All params are optional — the bundle adapts to what's available.
 */
export function buildContextBundle(opts: {
  indexQuotes?: quoteType[];
  watchlistSymbols?: string[];
  portfolios?: Portfolio[];
  headlines?: string[];
  gainers?: string[];
  losers?: string[];
}): ContextBundle {
  const bundle: ContextBundle = {
    timestamp: new Date().toISOString(),
    marketStatus: isMarketOpen() ? "OPEN" : "CLOSED",
  };

  if (opts.indexQuotes && opts.indexQuotes.length > 0) {
    bundle.indices = {};
    for (const q of opts.indexQuotes) {
      bundle.indices[q.symbol.toUpperCase()] = q.price;
    }
  }

  if (opts.gainers || opts.losers) {
    bundle.topMovers = {
      gainers: opts.gainers ?? [],
      losers: opts.losers ?? [],
    };
  }

  if (opts.headlines && opts.headlines.length > 0) {
    bundle.headlines = opts.headlines.slice(0, 5);
  }

  if (opts.watchlistSymbols && opts.watchlistSymbols.length > 0) {
    bundle.userWatchlist = opts.watchlistSymbols;
  }

  if (opts.portfolios && opts.portfolios.length > 0) {
    // Summarize portfolio holdings
    const allHoldings = opts.portfolios.flatMap((p) =>
      (p.securities ?? []).map((s) => s.symbol.toUpperCase())
    );
    const uniqueHoldings = [...new Set(allHoldings)];
    bundle.userPortfolioSummary = {
      totalValue: 0, // Would need live prices for real calc
      dayChangePercent: "N/A",
      holdings: uniqueHoldings,
    };
  }

  return bundle;
}

/**
 * Format the context bundle into a prompt prefix string.
 */
export function contextToPrompt(bundle: ContextBundle): string {
  return `CONTEXT BUNDLE (real-time data):\n${JSON.stringify(bundle, null, 2)}\n\n`;
}
