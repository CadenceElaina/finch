/**
 * Market Snapshot — Client-Side Consumer
 * ───────────────────────────────────────
 * Fetches the pre-warmed market snapshot from /api/snapshot (Redis Cloud).
 * On app load, this saves API calls by serving cached indices, movers, and
 * trending data that the Vercel Cron job pre-fetched at 9 AM ET.
 *
 * Flow:
 *   1. App starts → useMarketSnapshot() fires once
 *   2. Fetches /api/snapshot (Edge-cached, <50ms)
 *   3. Pre-populates React Query cache with index quotes
 *   4. Stores snapshot in localStorage as fallback
 *   5. Returns { indices, movers, trending, isLoading, isStale }
 *
 * If snapshot is missing or stale (>15 min), the flag `isStale` is set
 * so consumers know to trigger a fresh live fetch.
 */

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { quoteType } from "../components/search/types";
import { cacheStorage } from "./storage";

// ── Types ────────────────────────────────────────────────

export interface MarketSnapshot {
  timestamp: string;
  indices: {
    quoteResponse?: {
      result?: RawYHQuote[];
    };
  } | null;
  movers: {
    finance?: {
      result?: Array<{
        id: string;
        title: string;
        description: string;
        canonicalName: string;
        criteriaMeta: unknown;
        rawCriteria: string;
        start: number;
        count: number;
        total: number;
        quotes: RawYHQuote[];
      }>;
    };
  } | null;
  trending: {
    finance?: {
      result?: Array<{
        count: number;
        quotes: Array<{ symbol: string }>;
      }>;
    };
  } | null;
  errors: string[];
  age?: number;
  stale?: boolean;
}

// Minimal shape from YH Finance raw quote response
interface RawYHQuote {
  symbol: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  [key: string]: unknown;
}

export interface SnapshotResult {
  snapshot: MarketSnapshot | null;
  isLoading: boolean;
  isStale: boolean;
  error: string | null;
}

// ── Cache key ────────────────────────────────────────────

const SNAPSHOT_LS_KEY = "market_snapshot";
const SNAPSHOT_LS_TTL = 15 * 60_000; // 15 minutes

// ── Parse helpers ────────────────────────────────────────

function parseRawQuote(q: RawYHQuote): quoteType {
  return {
    symbol: (q.symbol ?? "").toLowerCase(),
    price: q.regularMarketPrice ?? 0,
    name: q.shortName ?? q.longName ?? "",
    priceChange: Number((q.regularMarketChange ?? 0).toFixed(2)),
    percentChange: q.regularMarketChangePercent ?? 0,
  };
}

/**
 * Hydrate the React Query cache with index quotes from the snapshot.
 * Each symbol gets its own cache entry so subsequent getBatchQuotes()
 * calls find them and skip the network request.
 */
function hydrateQueryCache(
  queryClient: ReturnType<typeof useQueryClient>,
  snapshot: MarketSnapshot
): void {
  const rawQuotes = snapshot.indices?.quoteResponse?.result ?? [];
  for (const raw of rawQuotes) {
    if (raw.symbol) {
      const parsed = parseRawQuote(raw);
      queryClient.setQueryData(["quote", raw.symbol], parsed);
      // Also persist to localStorage so it survives page refresh
      cacheStorage.set(`quote_${raw.symbol}`, parsed);
    }
  }
}

// ── Hook ─────────────────────────────────────────────────

/**
 * Fetches the market snapshot on mount. Call once near the app root.
 * Pre-populates React Query cache with index data.
 */
export function useMarketSnapshot(): SnapshotResult {
  const queryClient = useQueryClient();
  const [state, setState] = useState<SnapshotResult>({
    snapshot: null,
    isLoading: true,
    isStale: false,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchSnapshot() {
      // 1. Check localStorage first (covers dev mode / no KV)
      const cached = cacheStorage.get<MarketSnapshot>(
        SNAPSHOT_LS_KEY,
        SNAPSHOT_LS_TTL
      );
      if (cached && !cancelled) {
        hydrateQueryCache(queryClient, cached);
        setState({
          snapshot: cached,
          isLoading: false,
          isStale: false,
          error: null,
        });
        // Still try to fetch a fresher one in the background
      }

      // 2. Fetch from /api/snapshot (only in production)
      if (!import.meta.env.PROD) {
        // In dev, no KV — just use whatever cache we had
        if (!cached) {
          setState((s) => ({ ...s, isLoading: false, isStale: true }));
        }
        return;
      }

      try {
        const res = await fetch("/api/snapshot");
        if (!res.ok) {
          if (!cached && !cancelled) {
            setState({
              snapshot: null,
              isLoading: false,
              isStale: true,
              error: `Snapshot unavailable (${res.status})`,
            });
          }
          return;
        }

        const data: MarketSnapshot = await res.json();
        if (cancelled) return;

        // Hydrate React Query cache
        hydrateQueryCache(queryClient, data);

        // Persist to localStorage
        cacheStorage.set(SNAPSHOT_LS_KEY, data);

        setState({
          snapshot: data,
          isLoading: false,
          isStale: data.stale ?? false,
          error: null,
        });
      } catch (err) {
        if (!cached && !cancelled) {
          setState({
            snapshot: null,
            isLoading: false,
            isStale: true,
            error: String(err),
          });
        }
      }
    }

    fetchSnapshot();
    return () => {
      cancelled = true;
    };
  }, [queryClient]);

  return state;
}

/**
 * Extract parsed index quotes from a snapshot.
 * Returns a Record<symbol, quoteType> compatible with getBatchQuotes output.
 */
export function extractIndicesFromSnapshot(
  snapshot: MarketSnapshot
): Record<string, quoteType | null> {
  const result: Record<string, quoteType | null> = {};
  const rawQuotes = snapshot.indices?.quoteResponse?.result ?? [];
  for (const raw of rawQuotes) {
    if (raw.symbol) {
      result[raw.symbol] = parseRawQuote(raw);
    }
  }
  return result;
}

/**
 * Extract movers (gainers/losers/active) from a snapshot.
 * Returns the raw finance.result array for consumption by market trends.
 */
export function extractMoversFromSnapshot(
  snapshot: MarketSnapshot
): Array<{
  canonicalName: string;
  quotes: RawYHQuote[];
}> {
  return (snapshot.movers?.finance?.result ?? []).map((r) => ({
    canonicalName: r.canonicalName,
    quotes: r.quotes,
  }));
}

/**
 * Extract trending symbols from a snapshot.
 */
export function extractTrendingFromSnapshot(
  snapshot: MarketSnapshot
): string[] {
  const results = snapshot.trending?.finance?.result ?? [];
  if (results.length === 0) return [];
  return results[0].quotes.map((q) => q.symbol);
}
