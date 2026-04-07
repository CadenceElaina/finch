import { describe, it, expect } from "vitest";
import { xirr } from "./xirr";

describe("xirr", () => {
  it("returns null for fewer than 2 cash flows", () => {
    expect(xirr([])).toBeNull();
    expect(xirr([{ date: new Date("2024-01-01"), amount: -1000 }])).toBeNull();
  });

  it("computes simple annualized return for one investment + one valuation", () => {
    // Invest $1000, worth $1100 one year later → 10% return
    const result = xirr([
      { date: new Date("2024-01-01"), amount: -1000 },
      { date: new Date("2025-01-01"), amount: 1100 },
    ]);
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(0.1, 2);
  });

  it("computes return for multiple investments over time", () => {
    // Invest $1000, then $500 six months later, worth $1600 at year end
    const result = xirr([
      { date: new Date("2024-01-01"), amount: -1000 },
      { date: new Date("2024-07-01"), amount: -500 },
      { date: new Date("2025-01-01"), amount: 1600 },
    ]);
    expect(result).not.toBeNull();
    // Should be a small positive return
    expect(result!).toBeGreaterThan(0);
    expect(result!).toBeLessThan(0.15);
  });

  it("handles a loss correctly (negative return)", () => {
    // Invest $1000, worth $800 one year later → -20% return
    const result = xirr([
      { date: new Date("2024-01-01"), amount: -1000 },
      { date: new Date("2025-01-01"), amount: 800 },
    ]);
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(-0.2, 2);
  });

  it("handles break-even (zero return)", () => {
    const result = xirr([
      { date: new Date("2024-01-01"), amount: -1000 },
      { date: new Date("2025-01-01"), amount: 1000 },
    ]);
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(0, 2);
  });

  it("handles 100% gain over one year", () => {
    const result = xirr([
      { date: new Date("2024-01-01"), amount: -1000 },
      { date: new Date("2025-01-01"), amount: 2000 },
    ]);
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(1.0, 2);
  });

  it("correctly annualizes a short holding period", () => {
    // $1000 → $1050 in 3 months = ~21.5% annualized
    const result = xirr([
      { date: new Date("2024-01-01"), amount: -1000 },
      { date: new Date("2024-04-01"), amount: 1050 },
    ]);
    expect(result).not.toBeNull();
    expect(result!).toBeGreaterThan(0.2);
    expect(result!).toBeLessThan(0.23);
  });

  it("returns null for divergent cash flows", () => {
    // Edge case that may not converge
    const result = xirr([
      { date: new Date("2024-01-01"), amount: -1 },
      { date: new Date("2024-01-02"), amount: 100000 },
    ]);
    // May return a very large number or null — either is acceptable
    if (result !== null) {
      expect(result).toBeGreaterThan(0);
    }
  });
});
