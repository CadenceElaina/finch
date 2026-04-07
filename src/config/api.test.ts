import { describe, it, expect, beforeEach } from "vitest";
import {
  areProvidersImpaired,
  isMarketOpen,
  getQuoteRefreshInterval,
  readCachedModule,
  writeCachedModule,
  RATE_LIMITS,
  CACHE_POLICY,
  ENDPOINTS,
} from "./api";

describe("areProvidersImpaired", () => {
  it("returns false when no circuits are tripped", () => {
    // Fresh module load — no providers tripped
    expect(areProvidersImpaired()).toBe(false);
  });
});

describe("RATE_LIMITS", () => {
  it("has correct monthly cap", () => {
    expect(RATE_LIMITS.monthlyHardCap).toBe(500);
  });

  it("has daily budget", () => {
    expect(RATE_LIMITS.dailyBudget).toBe(16);
  });
});

describe("ENDPOINTS", () => {
  it("defines batch quotes endpoint", () => {
    expect(ENDPOINTS.batchQuotes.path).toBe("/api/market/get-quote");
    expect(ENDPOINTS.batchQuotes.cache.stale).toBe(30_000);
  });

  it("defines search endpoint", () => {
    expect(ENDPOINTS.search.path).toBe("/api/autocomplete");
  });

  it("all endpoints have cache config", () => {
    for (const [name, config] of Object.entries(ENDPOINTS)) {
      expect(config.cache, `${name} missing cache`).toBeDefined();
      expect(config.cache.stale, `${name} missing stale`).toBeGreaterThan(0);
      expect(config.cache.gc, `${name} missing gc`).toBeGreaterThan(0);
    }
  });

  it("stale time is always less than gc time", () => {
    for (const [name, config] of Object.entries(ENDPOINTS)) {
      expect(
        config.cache.stale,
        `${name}: stale (${config.cache.stale}) should be <= gc (${config.cache.gc})`
      ).toBeLessThanOrEqual(config.cache.gc);
    }
  });
});

describe("CACHE_POLICY", () => {
  it("symbol refresh is 30 seconds", () => {
    expect(CACHE_POLICY.symbolRefreshInterval).toBe(30_000);
  });

  it("modules refresh is 24 hours", () => {
    expect(CACHE_POLICY.modulesRefreshInterval).toBe(24 * 60 * 60_000);
  });
});

describe("isMarketOpen", () => {
  it("returns a boolean", () => {
    expect(typeof isMarketOpen()).toBe("boolean");
  });
});

describe("getQuoteRefreshInterval", () => {
  it("returns 30s during market hours or 24h otherwise", () => {
    const interval = getQuoteRefreshInterval();
    // Should be one of the two valid values
    expect([30_000, 24 * 60 * 60_000]).toContain(interval);
  });
});

describe("readCachedModule / writeCachedModule", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null for missing cache entry", () => {
    expect(readCachedModule("AAPL", "financials")).toBeNull();
  });

  it("round-trips data through write/read", () => {
    const data = { revenue: 100_000, eps: 6.5 };
    writeCachedModule("AAPL", "financials", data);
    const result = readCachedModule<typeof data>("AAPL", "financials");
    expect(result).toEqual(data);
  });

  it("returns null for expired cache entry", () => {
    // Write with a timestamp in the past (25 hours ago)
    const key = "finch_module_AAPL_financials";
    const staleTs = Date.now() - 25 * 60 * 60_000;
    localStorage.setItem(key, JSON.stringify({ data: { test: true }, ts: staleTs }));

    expect(readCachedModule("AAPL", "financials")).toBeNull();
    // Should also clean up the expired entry
    expect(localStorage.getItem(key)).toBeNull();
  });

  it("returns data for non-expired cache entry", () => {
    // Write with a recent timestamp (1 hour ago — within 24h TTL)
    const key = "finch_module_MSFT_profile";
    const recentTs = Date.now() - 1 * 60 * 60_000;
    localStorage.setItem(key, JSON.stringify({ data: { name: "Microsoft" }, ts: recentTs }));

    expect(readCachedModule("MSFT", "profile")).toEqual({ name: "Microsoft" });
  });

  it("handles corrupted localStorage gracefully", () => {
    localStorage.setItem("finch_module_AAPL_financials", "not-json");
    expect(readCachedModule("AAPL", "financials")).toBeNull();
  });
});
