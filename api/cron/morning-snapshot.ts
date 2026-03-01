/**
 * Vercel Cron — Morning Market Snapshot
 * ──────────────────────────────────────
 * Runs at 9:00 AM ET (13:00 UTC) on weekdays via Vercel Cron.
 * Pre-fetches market indices, movers, and trending tickers,
 * so the first user of the day gets instant data.
 *
 * Data flow:
 *   1. Fetches indices, movers, trending from YH Finance (3 API calls)
 *   2. Stores the combined snapshot in Redis Cloud (KV) with 15-min TTL
 *   3. Client reads from /api/snapshot → KV → instant response
 *
 * When KV is not configured, the cron still warms the Vercel Edge
 * Cache via Cache-Control headers on the proxy endpoints.
 *
 * Schedule: "0 13 * * 1-5" (Mon-Fri 9 AM ET = 1 PM UTC)
 */

import { getKv, disconnectKv, KV_SNAPSHOT_KEY, KV_SNAPSHOT_TTL } from "../_kv";

// Node.js runtime (not Edge) — required for TCP Redis connection

const YH_HOST = "yh-finance.p.rapidapi.com";

// US market indices we pre-fetch
const INDEX_SYMBOLS = "^DJI,^GSPC,^IXIC,^RUT,^VIX";

export interface MarketSnapshot {
  timestamp: string;
  indices: unknown;
  movers: unknown;
  trending: unknown;
  errors: string[];
}

export default async function handler(request: Request): Promise<Response> {
  // Verify this is called by Vercel Cron (Authorization header)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.YH_FINANCE_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "API key not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const headers = {
    "X-RapidAPI-Key": apiKey,
    "X-RapidAPI-Host": YH_HOST,
  };

  const snapshot: MarketSnapshot = {
    timestamp: new Date().toISOString(),
    indices: null,
    movers: null,
    trending: null,
    errors: [],
  };

  // Fetch indices, movers, and trending in parallel (3 API calls)
  const [indicesRes, moversRes, trendingRes] = await Promise.allSettled([
    fetch(
      `https://${YH_HOST}/market/v2/get-quotes?region=US&symbols=${INDEX_SYMBOLS}`,
      { headers }
    ),
    fetch(
      `https://${YH_HOST}/market/v2/get-movers?region=US&lang=en-US&count=25&start=0`,
      { headers }
    ),
    fetch(
      `https://${YH_HOST}/market/get-trending-tickers?region=US`,
      { headers }
    ),
  ]);

  if (indicesRes.status === "fulfilled" && indicesRes.value.ok) {
    snapshot.indices = await indicesRes.value.json();
  } else {
    snapshot.errors.push("indices fetch failed");
  }

  if (moversRes.status === "fulfilled" && moversRes.value.ok) {
    snapshot.movers = await moversRes.value.json();
  } else {
    snapshot.errors.push("movers fetch failed");
  }

  if (trendingRes.status === "fulfilled" && trendingRes.value.ok) {
    snapshot.trending = await trendingRes.value.json();
  } else {
    snapshot.errors.push("trending fetch failed");
  }

  // Write to Redis if configured
  let kvWritten = false;
  try {
    const kv = await getKv();
    if (kv) {
      await kv.set(KV_SNAPSHOT_KEY, JSON.stringify(snapshot), {
        EX: KV_SNAPSHOT_TTL,
      });
      kvWritten = true;
    }
  } catch (err) {
    snapshot.errors.push(`KV write failed: ${String(err)}`);
  } finally {
    await disconnectKv();
  }

  return new Response(
    JSON.stringify({ ...snapshot, kvWritten }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Also cache at the Edge as a fallback
        "Cache-Control": "s-maxage=900, stale-while-revalidate=600",
      },
    }
  );
}
