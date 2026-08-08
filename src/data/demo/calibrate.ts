/**
 * Demo-portfolio calibration.
 *
 * The seeded demo holdings originally carried absolute purchase prices tuned
 * against the static fixtures in `quotes.ts`. Live quotes drift away from
 * those fixtures — and for some tickers the upstream feed reports a different
 * instrument entirely — so a demo holding could render an implausible result
 * (VO showed -61.68% against a $215.80 cost basis while the feed returned
 * $82.69). That reads as broken math rather than as a market move.
 *
 * Instead each demo holding declares `costRatio`: the fraction of *today's*
 * price it was notionally bought at. 0.88 means "bought 12% below current",
 * i.e. a +13.6% position. Resolving that against the live quote at seed time
 * keeps the showcase plausible no matter where prices sit, and the result is
 * written to storage as an ordinary portfolio the user then owns.
 */

import { Portfolio, Security } from "../../types/types";

/** A demo holding carries the ratio alongside the fixture-era fallback price. */
export interface DemoSecurity extends Security {
  /** Purchase price as a fraction of the current price. */
  costRatio?: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Resolve `costRatio` into a concrete `purchasePrice` using live prices, and
 * rebase the synthetic value history so its final point matches the resulting
 * portfolio value.
 *
 * Holdings without a `costRatio`, or whose symbol has no usable live price,
 * keep their existing `purchasePrice` — so a partial quote response degrades
 * to the previous behaviour rather than zeroing the position out.
 */
export function calibrateDemoPortfolio(
  portfolio: Portfolio,
  priceBySymbol: Record<string, number | null | undefined>
): Portfolio {
  const securities = (portfolio.securities ?? []) as DemoSecurity[];
  if (securities.length === 0) return portfolio;

  const priceFor = (symbol: string) => {
    const p = priceBySymbol[symbol] ?? priceBySymbol[symbol.toUpperCase()];
    return typeof p === "number" && isFinite(p) && p > 0 ? p : undefined;
  };

  let changed = false;
  const calibrated: Security[] = securities.map((sec) => {
    const live = priceFor(sec.symbol);
    if (!sec.costRatio || live === undefined) return sec;
    const purchasePrice = round2(live * sec.costRatio);
    if (purchasePrice === sec.purchasePrice) return sec;
    changed = true;
    return { ...sec, purchasePrice };
  });

  if (!changed) return portfolio;

  // Rebase the value history onto the live total so the performance chart
  // ends where the holdings table says the portfolio is worth.
  const liveValue = calibrated.reduce((sum, s) => {
    const live = priceFor(s.symbol);
    return live === undefined ? sum : sum + live * s.quantity;
  }, 0);

  const history = portfolio.portfolioValue ?? [];
  const lastValue = history.length > 0 ? Number(history[history.length - 1].value) : 0;
  const scale = lastValue > 0 && liveValue > 0 ? liveValue / lastValue : 1;

  return {
    ...portfolio,
    securities: calibrated,
    portfolioValue:
      scale === 1
        ? history
        : history.map((entry) => ({
            date: entry.date,
            value: round2(Number(entry.value) * scale),
          })),
  };
}

/** Symbols referenced by a set of portfolios, de-duplicated. */
export function demoSymbols(portfolios: Portfolio[]): string[] {
  const seen = new Set<string>();
  for (const p of portfolios) {
    for (const s of p.securities ?? []) seen.add(s.symbol);
  }
  return [...seen];
}
