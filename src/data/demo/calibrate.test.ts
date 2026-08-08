import { describe, it, expect } from "vitest";
import { calibrateDemoPortfolio, demoSymbols, type DemoSecurity } from "./calibrate";
import type { Portfolio } from "../../types/types";

const holding = (over: Partial<DemoSecurity> = {}): DemoSecurity => ({
  symbol: "vo",
  quantity: 25,
  purchasePrice: 215.8,
  purchaseDate: "2024-03-15",
  costRatio: 0.88,
  ...over,
});

const portfolio = (securities: DemoSecurity[], value = 5000): Portfolio =>
  ({
    id: "p1",
    title: "Core ETFs",
    isDemo: true,
    securities,
    portfolioValue: [
      { date: "03/15/2024", value: value * 0.9 },
      { date: "08/08/2026", value },
    ],
  }) as Portfolio;

describe("calibrateDemoPortfolio", () => {
  it("derives purchase price from the live price and cost ratio", () => {
    // Regression: a $215.80 fixture cost basis against a live $82.69 rendered
    // -61.68% on an untouched demo portfolio.
    const out = calibrateDemoPortfolio(portfolio([holding()]), { vo: 82.69 });

    expect(out.securities?.[0].purchasePrice).toBeCloseTo(72.77, 2);
  });

  it("produces the gain implied by the ratio, whatever the price", () => {
    for (const price of [82.69, 238.45, 1000]) {
      const out = calibrateDemoPortfolio(portfolio([holding()]), { vo: price });
      const cost = out.securities![0].purchasePrice;
      const gainPct = ((price - cost) / cost) * 100;
      // costRatio 0.88 -> ~+13.6%
      expect(gainPct).toBeGreaterThan(13);
      expect(gainPct).toBeLessThan(14.5);
    }
  });

  it("models a loss when the ratio is above 1", () => {
    const out = calibrateDemoPortfolio(
      portfolio([holding({ symbol: "tsla", costRatio: 1.12 })]),
      { tsla: 100 }
    );
    expect(out.securities?.[0].purchasePrice).toBeCloseTo(112, 2);
  });

  it("matches symbols case-insensitively", () => {
    const out = calibrateDemoPortfolio(portfolio([holding()]), { VO: 82.69 });
    expect(out.securities?.[0].purchasePrice).toBeCloseTo(72.77, 2);
  });

  it("rebases value history to end at the live portfolio value", () => {
    const out = calibrateDemoPortfolio(portfolio([holding()]), { vo: 82.69 });
    const history = out.portfolioValue!;
    // 25 shares * $82.69
    expect(Number(history[history.length - 1].value)).toBeCloseTo(2067.25, 1);
  });

  it("keeps the fallback price when the quote is missing or unusable", () => {
    for (const quotes of [{}, { vo: null }, { vo: 0 }, { vo: NaN }]) {
      const out = calibrateDemoPortfolio(portfolio([holding()]), quotes);
      expect(out.securities?.[0].purchasePrice).toBe(215.8);
    }
  });

  it("leaves holdings without a cost ratio untouched", () => {
    const out = calibrateDemoPortfolio(
      portfolio([holding({ costRatio: undefined })]),
      { vo: 82.69 }
    );
    expect(out.securities?.[0].purchasePrice).toBe(215.8);
  });

  it("returns the same object when nothing changes, so React can skip a write", () => {
    const p = portfolio([holding({ costRatio: undefined })]);
    expect(calibrateDemoPortfolio(p, { vo: 82.69 })).toBe(p);
  });
});

describe("demoSymbols", () => {
  it("collects symbols across portfolios without duplicates", () => {
    const a = portfolio([holding({ symbol: "vo" }), holding({ symbol: "vb" })]);
    const b = portfolio([holding({ symbol: "vo" }), holding({ symbol: "bnd" })]);
    expect(demoSymbols([a, b]).sort()).toEqual(["bnd", "vb", "vo"]);
  });
});
