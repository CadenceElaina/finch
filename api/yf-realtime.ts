/**
 * Vercel Edge Function — Yahoo Finance Real Time API Proxy
 * ────────────────────────────────────────────────────────
 * Proxies requests to yahoo-finance-real-time1.p.rapidapi.com.
 * This provider uses standard Yahoo Finance response format
 * with simple endpoint paths (no version prefixes).
 *
 * Called as Tier 3 fallback when YH166 and ApiDojo are exhausted.
 *
 * Usage: GET /api/yf-realtime?endpoint=/api/market/get-quote&symbols=AAPL,MSFT
 */

export const config = {
  runtime: "edge",
};

const YFREALTIME_HOST = "yahoo-finance-real-time1.p.rapidapi.com";

// ── YH166 endpoint → YF RealTime path mapping ───────────

const PATH_MAP: Record<string, string> = {
  "/api/market/get-quote":                    "/market/get-quotes",
  "/api/autocomplete":                        "/search",
  "/api/stock/get-chart":                     "/stock/get-chart",
  "/api/market/get-day-gainers":              "/market/get-movers",
  "/api/market/get-day-losers":               "/market/get-movers",
  "/api/market/get-most-actives":             "/market/get-movers",
  "/api/market/get-trending":                 "/market/get-trending-tickers",
  "/api/market/get-world-indices":            "/market/get-summary",
  "/api/market/get-market-summary":           "/market/get-summary",
  "/api/stock/get-financial-data":            "/stock/get-analysis",
  "/api/stock/get-statistics":                "/stock/get-quote-summary",
  "/api/stock/get-company-outlook-summary":   "/stock/get-insights",
  "/api/stock/get-upgrade-downgrade-history": "/stock/get-recommendations",
};

// Cache-Control headers per YH166 endpoint
const CACHE_HEADERS: Record<string, string> = {
  "/api/market/get-quote": "s-maxage=30, stale-while-revalidate=60",
  "/api/autocomplete": "s-maxage=86400, stale-while-revalidate=3600",
  "/api/stock/get-chart": "s-maxage=300, stale-while-revalidate=120",
  "/api/market/get-day-gainers": "s-maxage=60, stale-while-revalidate=30",
  "/api/market/get-day-losers": "s-maxage=60, stale-while-revalidate=30",
  "/api/market/get-most-actives": "s-maxage=60, stale-while-revalidate=30",
  "/api/stock/get-financial-data": "s-maxage=3600, stale-while-revalidate=600",
  "/api/stock/get-statistics": "s-maxage=3600, stale-while-revalidate=600",
  "/api/market/get-trending": "s-maxage=60, stale-while-revalidate=30",
  "/api/stock/get-company-outlook-summary": "s-maxage=3600, stale-while-revalidate=600",
  "/api/market/get-world-indices": "s-maxage=60, stale-while-revalidate=30",
  "/api/market/get-market-summary": "s-maxage=60, stale-while-revalidate=30",
  "/api/stock/get-upgrade-downgrade-history": "s-maxage=3600, stale-while-revalidate=600",
};

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = new URL(request.url);
  const endpoint = url.searchParams.get("endpoint");

  if (!endpoint || !PATH_MAP[endpoint]) {
    return new Response(
      JSON.stringify({
        error: "Invalid or unmapped endpoint for YF RealTime fallback",
        supported: Object.keys(PATH_MAP),
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const apiKey = process.env.YH_FINANCE_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "API key not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Collect all params except 'endpoint'
  const params: Record<string, string> = {};
  for (const [key, value] of url.searchParams.entries()) {
    if (key !== "endpoint") params[key] = value;
  }

  const realtimePath = PATH_MAP[endpoint];

  // Build upstream URL
  const upstreamUrl = new URL(`https://${YFREALTIME_HOST}${realtimePath}`);
  for (const [key, value] of Object.entries(params)) {
    upstreamUrl.searchParams.set(key, value);
  }

  try {
    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": YFREALTIME_HOST,
      },
    });

    if (!upstreamResponse.ok) {
      return new Response(
        JSON.stringify({
          error: "YF RealTime upstream error",
          status: upstreamResponse.status,
        }),
        {
          status: upstreamResponse.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const data = await upstreamResponse.text();
    const cacheControl = CACHE_HEADERS[endpoint] ?? "s-maxage=60";

    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": cacheControl,
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "YF RealTime proxy request failed" }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
