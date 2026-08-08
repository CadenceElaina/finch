import { describe, it, expect } from "vitest";
import {
  displaySymbol,
  normalizeSymbol,
  preferredName,
  tickerHue,
} from "./ticker";

describe("preferredName", () => {
  it("prefers longName over Yahoo's 31-char shortName", () => {
    // Regression: holdings showed "Vanguard Total International St",
    // which reads as a real name rather than as truncation.
    expect(
      preferredName(
        "Vanguard Total International Stock Index Fund ETF Shares",
        "Vanguard Total International St"
      )
    ).toBe("Vanguard Total International Stock Index Fund ETF Shares");
  });

  it("falls back to shortName when longName is absent or blank", () => {
    expect(preferredName(undefined, "Apple Inc.")).toBe("Apple Inc.");
    expect(preferredName(null, "Apple Inc.")).toBe("Apple Inc.");
    expect(preferredName("   ", "Apple Inc.")).toBe("Apple Inc.");
  });

  it("falls back to the supplied fallback when both are missing", () => {
    expect(preferredName(undefined, undefined, "AAPL")).toBe("AAPL");
    expect(preferredName(undefined, undefined)).toBe("");
  });
});

describe("displaySymbol", () => {
  it("uppercases mixed-case symbols", () => {
    // Demo lists store "nvda" while default lists store "NVDA"; the homepage
    // merges both and previously rendered them side by side inconsistently.
    expect(displaySymbol("nvda")).toBe("NVDA");
    expect(displaySymbol("NVDA")).toBe("NVDA");
  });

  it("drops the quote-currency suffix", () => {
    expect(displaySymbol("btc-usd")).toBe("BTC");
  });

  it("returns empty string for missing input", () => {
    expect(displaySymbol(null)).toBe("");
    expect(displaySymbol(undefined)).toBe("");
    expect(displaySymbol("")).toBe("");
  });
});

describe("normalizeSymbol", () => {
  it("uppercases without dropping the suffix", () => {
    expect(normalizeSymbol("btc-usd")).toBe("BTC-USD");
  });
});

describe("tickerHue", () => {
  it("is stable across calls for the same symbol", () => {
    // Regression: badge colors came from getRandomColor() and changed on
    // every render.
    expect(tickerHue("AAPL")).toBe(tickerHue("AAPL"));
  });

  it("ignores casing so merged lists agree", () => {
    expect(tickerHue("nvda")).toBe(tickerHue("NVDA"));
  });

  it("always produces a valid hue", () => {
    for (const s of ["A", "AAPL", "BTC-USD", "VXUS", "zzzz", "SHOP"]) {
      const h = tickerHue(s);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(360);
      expect(Number.isInteger(h)).toBe(true);
    }
  });

  it("falls back to a fixed hue for missing input", () => {
    expect(tickerHue(undefined)).toBe(210);
  });
});
