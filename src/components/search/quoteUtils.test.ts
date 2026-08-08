import { describe, it, expect, beforeEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { getBatchQuotes } from "./quoteUtils";
import type { quoteType } from "./types";

/**
 * These exercise the cache-drain path only — every symbol under test is
 * pre-seeded into the QueryClient, so no network call is attempted.
 */

const seed = (qc: QueryClient, symbol: string, price: number) => {
  const quote: quoteType = {
    symbol: symbol.toLowerCase(),
    price,
    name: `${symbol} Test`,
    priceChange: 1,
    percentChange: 1,
  };
  qc.setQueryData(["quote", symbol], quote);
  return quote;
};

describe("getBatchQuotes symbol casing", () => {
  let qc: QueryClient;

  beforeEach(() => {
    qc = new QueryClient();
    localStorage.clear();
  });

  it("resolves a lowercase request against the canonical cache entry", async () => {
    // Demo lists store "vo" while the default market-watch list stores "VO".
    // Both must hit the single canonical entry rather than missing the cache
    // and triggering a second fetch for the same instrument.
    seed(qc, "VO", 238.45);

    const result = await getBatchQuotes(qc, ["vo"]);

    expect(result["vo"]?.price).toBe(238.45);
  });

  it("returns one value under every requested spelling", async () => {
    seed(qc, "VO", 238.45);

    const result = await getBatchQuotes(qc, ["vo", "VO", "Vo"]);

    expect(result["vo"]?.price).toBe(238.45);
    expect(result["VO"]?.price).toBe(238.45);
    expect(result["Vo"]?.price).toBe(238.45);
  });

  it("keeps distinct symbols separate", async () => {
    seed(qc, "VO", 238.45);
    seed(qc, "VB", 218.3);

    const result = await getBatchQuotes(qc, ["vo", "vb"]);

    expect(result["vo"]?.price).toBe(238.45);
    expect(result["vb"]?.price).toBe(218.3);
  });

  it("preserves the suffix on hyphenated symbols", async () => {
    seed(qc, "BTC-USD", 64934.96);

    const result = await getBatchQuotes(qc, ["btc-usd"]);

    expect(result["btc-usd"]?.price).toBe(64934.96);
  });
});
