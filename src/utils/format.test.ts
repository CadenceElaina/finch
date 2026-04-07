import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatPriceChange,
  formatLargeNumber,
} from "./format";

describe("formatCurrency", () => {
  it("formats positive values as USD", () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56");
  });

  it("formats negative values", () => {
    expect(formatCurrency(-50.1)).toBe("-$50.10");
  });

  it("returns — for null, undefined, NaN", () => {
    expect(formatCurrency(null)).toBe("—");
    expect(formatCurrency(undefined)).toBe("—");
    expect(formatCurrency(NaN)).toBe("—");
  });

  it("respects custom decimal places", () => {
    expect(formatCurrency(9.9, 0)).toBe("$10");
    expect(formatCurrency(9.1234, 3)).toBe("$9.123");
  });

  it("handles zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });
});

describe("formatNumber", () => {
  it("formats with commas and decimals", () => {
    expect(formatNumber(1234567.89)).toBe("1,234,567.89");
  });

  it("returns — for nullish or NaN", () => {
    expect(formatNumber(null)).toBe("—");
    expect(formatNumber(undefined)).toBe("—");
    expect(formatNumber(NaN)).toBe("—");
  });

  it("respects decimal places", () => {
    expect(formatNumber(42, 0)).toBe("42");
  });
});

describe("formatPercent", () => {
  it("adds + sign for positive values", () => {
    expect(formatPercent(2.24)).toBe("+2.24%");
  });

  it("keeps - sign for negative values", () => {
    expect(formatPercent(-1.05)).toBe("-1.05%");
  });

  it("handles zero", () => {
    expect(formatPercent(0)).toBe("0.00%");
  });

  it("returns — for null/NaN", () => {
    expect(formatPercent(null)).toBe("—");
    expect(formatPercent(NaN)).toBe("—");
  });

  it("respects custom decimal places", () => {
    expect(formatPercent(3.14159, 1)).toBe("+3.1%");
  });
});

describe("formatPriceChange", () => {
  it("formats positive change with +$", () => {
    expect(formatPriceChange(8.98)).toBe("+$8.98");
  });

  it("formats negative change with -$", () => {
    expect(formatPriceChange(-8.98)).toBe("-$8.98");
  });

  it("formats zero as $0.00", () => {
    expect(formatPriceChange(0)).toBe("$0.00");
  });

  it("returns — for null/NaN", () => {
    expect(formatPriceChange(null)).toBe("—");
    expect(formatPriceChange(NaN)).toBe("—");
  });
});

describe("formatLargeNumber", () => {
  it("formats trillions", () => {
    expect(formatLargeNumber(2.92e12)).toBe("2.92T");
  });

  it("formats billions", () => {
    expect(formatLargeNumber(41.58e9)).toBe("41.58B");
  });

  it("formats millions", () => {
    expect(formatLargeNumber(5.2e6)).toBe("5.20M");
  });

  it("formats thousands", () => {
    expect(formatLargeNumber(8500)).toBe("8.50K");
  });

  it("formats small numbers normally", () => {
    expect(formatLargeNumber(42)).toBe("42.00");
  });

  it("handles negative large numbers", () => {
    expect(formatLargeNumber(-3.5e9)).toBe("-3.50B");
  });

  it("returns — for null/NaN", () => {
    expect(formatLargeNumber(null)).toBe("—");
    expect(formatLargeNumber(NaN)).toBe("—");
  });
});
