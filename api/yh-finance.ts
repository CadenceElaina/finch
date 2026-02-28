/**
 * Vercel Edge Function — YH Finance API Proxy
 * ─────────────────────────────────────────────
 * Proxies requests to yh-finance.p.rapidapi.com.
 * API key is stored as a Vercel environment variable (never exposed to client).
 *
 * Usage: Client calls /api/yh-finance?endpoint=/market/v2/get-quotes&symbols=AAPL,MSFT
 *
 * Supported endpoints:
 *   - /market/v2/get-quotes  (batch quotes)
 *   - /auto-complete         (search)
 *   - /stock/v3/get-chart    (price history)
 *   - /market/v2/get-movers  (gainers/losers/active)
 *   - /stock/v3/get-profile  (company profile)
 *   - /market/get-trending-tickers (trending)
 */

export const config = {
  runtime: "edge",
};

const YH_HOST = "yh-finance.p.rapidapi.com";

// Allowlist of YH Finance paths we proxy (prevents abuse)
const ALLOWED_PATHS = new Set([
  "/market/v2/get-quotes",
  "/auto-complete",
  "/stock/v3/get-chart",
  "/market/v2/get-movers",
  "/stock/v3/get-profile",
  "/market/get-trending-tickers",
]);

// Cache-Control headers per endpoint (seconds)
const CACHE_HEADERS: Record<string, string> = {
  "/market/v2/get-quotes": "s-maxage=30, stale-while-revalidate=60",
  "/auto-complete": "s-maxage=86400, stale-while-revalidate=3600",
  "/stock/v3/get-chart": "s-maxage=300, stale-while-revalidate=120",
  "/market/v2/get-movers": "s-maxage=60, stale-while-revalidate=30",
  "/stock/v3/get-profile": "s-maxage=3600, stale-while-revalidate=600",
  "/market/get-trending-tickers": "s-maxage=60, stale-while-revalidate=30",
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
