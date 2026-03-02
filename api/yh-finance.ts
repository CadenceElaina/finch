/**
 * Vercel Edge Function — Yahoo Finance 166 API Proxy
 * ─────────────────────────────────────────────────────
 * Proxies requests to yahoo-finance166.p.rapidapi.com.
 * API key is stored as a Vercel environment variable (never exposed to client).
 *
 * Usage: Client calls /api/yh-finance?endpoint=/api/market/get-quote&symbols=AAPL,MSFT
 */

export const config = {
  runtime: "edge",
};

const YH_HOST = "yahoo-finance166.p.rapidapi.com";

// Allowlist of Yahoo Finance 166 paths we proxy (prevents abuse)
const ALLOWED_PATHS = new Set([
  "/api/market/get-quote",
  "/api/market/get-quote-v2",
  "/api/autocomplete",
  "/api/stock/get-chart",
  "/api/market/get-day-gainers",
  "/api/market/get-day-losers",
  "/api/market/get-most-actives",
  "/api/stock/get-financial-data",
  "/api/stock/get-statistics",
  "/api/market/get-trending",
  "/api/stock/get-upgrade-downgrade-history",
  "/api/market/get-world-indices",
  "/api/market/get-market-summary",
  "/api/stock/get-company-outlook-summary",
]);

// Cache-Control headers per endpoint (seconds)
const CACHE_HEADERS: Record<string, string> = {
  "/api/market/get-quote": "s-maxage=30, stale-while-revalidate=60",
  "/api/market/get-quote-v2": "s-maxage=30, stale-while-revalidate=60",
  "/api/autocomplete": "s-maxage=86400, stale-while-revalidate=3600",
  "/api/stock/get-chart": "s-maxage=300, stale-while-revalidate=120",
  "/api/market/get-day-gainers": "s-maxage=60, stale-while-revalidate=30",
  "/api/market/get-day-losers": "s-maxage=60, stale-while-revalidate=30",
  "/api/market/get-most-actives": "s-maxage=60, stale-while-revalidate=30",
  "/api/stock/get-financial-data": "s-maxage=3600, stale-while-revalidate=600",
  "/api/stock/get-statistics": "s-maxage=3600, stale-while-revalidate=600",
  "/api/market/get-trending": "s-maxage=60, stale-while-revalidate=30",
  "/api/stock/get-upgrade-downgrade-history": "s-maxage=3600, stale-while-revalidate=600",
  "/api/market/get-world-indices": "s-maxage=60, stale-while-revalidate=30",
  "/api/market/get-market-summary": "s-maxage=60, stale-while-revalidate=30",
  "/api/stock/get-company-outlook-summary": "s-maxage=3600, stale-while-revalidate=600",
};

export default async function handler(request: Request): Promise<Response> {
  // Only allow GET requests
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = new URL(request.url);
  const endpoint = url.searchParams.get("endpoint");

  if (!endpoint || !ALLOWED_PATHS.has(endpoint)) {
    return new Response(
      JSON.stringify({ error: "Invalid or missing endpoint parameter" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Read API key from Vercel environment variable (server-side only)
  const apiKey = process.env.YH_FINANCE_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "API key not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Build upstream URL — forward all query params except 'endpoint'
  const upstreamUrl = new URL(`https://${YH_HOST}${endpoint}`);
  for (const [key, value] of url.searchParams.entries()) {
    if (key !== "endpoint") {
      upstreamUrl.searchParams.set(key, value);
    }
  }

  try {
    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": YH_HOST,
      },
    });

    if (!upstreamResponse.ok) {
      return new Response(
        JSON.stringify({
          error: "Upstream API error",
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
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Proxy request failed" }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
