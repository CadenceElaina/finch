/**
 * Holdings aggregation.
 *
 * Extracted from PortfolioPerformance so the money math is testable without a
 * React tree. The rule that matters here: a holding the feed couldn't price is
 * *unknown*, not worthless. Treating a missing quote as $0 (the previous
 * behaviour) reported that holding as -100% and subtracted its full cost basis
 * from the portfolio's return — one renamed ticker made a healthy portfolio
 * look catastrophic.
 */

export interface PricedHolding {
  costBasis: number;
  currentValue: number;
  resolved: boolean;
}

export interface PortfolioTotals {
  totalCostBasis: number;
  totalCurrentValue: number;
  totalGain: number;
  totalGainPct: number;
  /** Holdings excluded because no quote was available. */
  unpricedCount: number;
}

export function summarizeHoldings(
  holdings: readonly PricedHolding[]
): PortfolioTotals {
  const priced = holdings.filter((h) => h.resolved);
  const totalCostBasis = priced.reduce((s, h) => s + h.costBasis, 0);
  const totalCurrentValue = priced.reduce((s, h) => s + h.currentValue, 0);
  const totalGain = totalCurrentValue - totalCostBasis;
  return {
    totalCostBasis,
    totalCurrentValue,
    totalGain,
    totalGainPct: totalCostBasis > 0 ? (totalGain / totalCostBasis) * 100 : 0,
    unpricedCount: holdings.length - priced.length,
  };
}

/** A quote is usable only if it carries a real, positive price. */
export function isQuoteResolved(
  quote: { price?: number | null } | null | undefined
): boolean {
  return (
    typeof quote?.price === "number" &&
    isFinite(quote.price) &&
    quote.price > 0
  );
}
