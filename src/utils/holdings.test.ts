import { describe, it, expect } from "vitest";
import { summarizeHoldings, isQuoteResolved } from "./holdings";

const h = (costBasis: number, currentValue: number, resolved = true) => ({
  costBasis,
  currentValue,
  resolved,
});

describe("summarizeHoldings", () => {
  it("sums priced holdings", () => {
    const t = summarizeHoldings([h(1000, 1200), h(500, 450)]);
    expect(t.totalCostBasis).toBe(1500);
    expect(t.totalCurrentValue).toBe(1650);
    expect(t.totalGain).toBe(150);
    expect(t.totalGainPct).toBeCloseTo(10, 5);
    expect(t.unpricedCount).toBe(0);
  });

  it("excludes an unpriced holding instead of counting it as a total loss", () => {
    // Regression: SQ stopped resolving, defaulted to $0, and reported the
    // portfolio as down its entire cost basis.
    const withUnpriced = summarizeHoldings([h(1000, 1200), h(5000, 0, false)]);
    const withoutIt = summarizeHoldings([h(1000, 1200)]);

    expect(withUnpriced.totalGainPct).toBeCloseTo(withoutIt.totalGainPct, 5);
    expect(withUnpriced.totalGainPct).toBeCloseTo(20, 5);
    expect(withUnpriced.totalCostBasis).toBe(1000);
    expect(withUnpriced.unpricedCount).toBe(1);
  });

  it("does not report a loss when the only unpriced holding is dropped", () => {
    const t = summarizeHoldings([h(1000, 1100), h(9999, 0, false)]);
    expect(t.totalGain).toBeGreaterThan(0);
  });

  it("handles an all-unpriced portfolio without dividing by zero", () => {
    const t = summarizeHoldings([h(1000, 0, false)]);
    expect(t.totalGainPct).toBe(0);
    expect(t.totalCurrentValue).toBe(0);
    expect(t.unpricedCount).toBe(1);
  });

  it("handles an empty portfolio", () => {
    const t = summarizeHoldings([]);
    expect(t.totalGainPct).toBe(0);
    expect(t.unpricedCount).toBe(0);
  });
});

describe("isQuoteResolved", () => {
  it("accepts a real positive price", () => {
    expect(isQuoteResolved({ price: 82.69 })).toBe(true);
  });

  it("rejects the values a failed lookup produces", () => {
    expect(isQuoteResolved(null)).toBe(false);
    expect(isQuoteResolved(undefined)).toBe(false);
    expect(isQuoteResolved({})).toBe(false);
    expect(isQuoteResolved({ price: null })).toBe(false);
    expect(isQuoteResolved({ price: 0 })).toBe(false);
    expect(isQuoteResolved({ price: NaN })).toBe(false);
    expect(isQuoteResolved({ price: Infinity })).toBe(false);
  });

  it("rejects a negative price", () => {
    expect(isQuoteResolved({ price: -5 })).toBe(false);
  });
});
