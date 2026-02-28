/**
 * Vercel Cron — Morning Market Snapshot
 * ──────────────────────────────────────
 * Runs at 9:00 AM ET (13:00 UTC) on weekdays via Vercel Cron.
 * Pre-fetches market indices, movers, and trending tickers,
 * so the first user of the day gets instant data.
 *
 * Data is stored in Vercel KV (or returned for Vercel Edge Cache).
 * When KV is not configured, the cron still warms the Vercel Edge
 * Cache via Cache-Control headers on the proxy endpoints.
 *
 * Schedule: "0 13 * * 1-5" (Mon-Fri 9 AM ET = 1 PM UTC)
 */

export const config = {
  runtime: "edge",
};

const YH_HOST = "yh-finance.p.rapidapi.com";

// US market indices we pre-fetch
const INDEX_SYMBOLS = "^DJI,^GSPC,^IXIC,^RUT,^VIX";

interface SnapshotResult {
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

  const snapshot: SnapshotResult = {
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

  // If Vercel KV is configured, store the snapshot
  // (KV integration added separately when @vercel/kv is installed)
  // For now, returning the snapshot so the Edge Cache caches it.

  return new Response(JSON.stringify(snapshot), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      // Cache for 15 minutes — subsequent reads get cached data
      "Cache-Control": "s-maxage=900, stale-while-revalidate=600",
    },
  });
}
