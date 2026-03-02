/**
 * Vercel Edge Function — ApiDojo Yahoo Finance v1 Proxy
 * ─────────────────────────────────────────────────────
 * Proxies requests to apidojo-yahoo-finance-v1.p.rapidapi.com.
 * This is the classic Yahoo Finance API on RapidAPI — same response
 * format as YH166, different endpoint paths.
 *
 * Called as Tier 2 fallback when YH166 is exhausted.
 *
 * Usage: GET /api/apidojo-finance?endpoint=/api/market/get-quote&symbols=AAPL,MSFT
 */

export const config = {
  runtime: "edge",
};

const APIDOJO_HOST = "apidojo-yahoo-finance-v1.p.rapidapi.com";

// ── YH166 endpoint → ApiDojo path mapping ────────────────

const PATH_MAP: Record<string, string> = {
  "/api/market/get-quote":                    "/market/v2/get-quotes",
  "/api/autocomplete":                        "/auto-complete",
  "/api/stock/get-chart":                     "/stock/v3/get-chart",
  "/api/market/get-day-gainers":              "/market/v2/get-movers",
  "/api/market/get-day-losers":               "/market/v2/get-movers",
  "/api/market/get-most-actives":             "/market/v2/get-movers",
  "/api/stock/get-financial-data":            "/stock/get-fundamentals",
  "/api/stock/get-statistics":                "/stock/v4/get-statistics",
  "/api/market/get-trending":                 "/market/get-trending-tickers",
  "/api/stock/get-company-outlook-summary":   "/stock/get-company-outlook",
  "/api/market/get-world-indices":            "/market/v2/get-summary",
  "/api/market/get-market-summary":           "/market/v2/get-summary",
  "/api/stock/get-upgrade-downgrade-history": "/stock/v3/get-upgrades-downgrades",
};

/**
 * Map YH166 param names to ApiDojo equivalents.
 * Most params are the same; autocomplete uses `q` instead of `query`.
 */
function mapParams(
  endpoint: string,
  params: Record<string, string>
): Record<string, string> {
  const mapped = { ...params };

  if (endpoint === "/api/autocomplete") {
    mapped.q = mapped.query ?? "";
    delete mapped.query;
  }

  // fundamentals: ApiDojo requires a `modules` parameter
  if (endpoint === "/api/stock/get-financial-data" && !mapped.modules) {
    mapped.modules = "assetProfile,defaultKeyStatistics,summaryDetail,price";
  }

  return mapped;
}

// Cache-Control headers
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
        error: "Invalid or unmapped endpoint for ApiDojo fallback",
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
  const originalParams: Record<string, string> = {};
  for (const [key, value] of url.searchParams.entries()) {
    if (key !== "endpoint") originalParams[key] = value;
  }

  const mappedParams = mapParams(endpoint, originalParams);
  const apiDojoPath = PATH_MAP[endpoint];

  // Build upstream URL
  const upstreamUrl = new URL(`https://${APIDOJO_HOST}${apiDojoPath}`);
  for (const [key, value] of Object.entries(mappedParams)) {
    upstreamUrl.searchParams.set(key, value);
  }

  try {
    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": APIDOJO_HOST,
      },
    });

    if (!upstreamResponse.ok) {
      return new Response(
        JSON.stringify({
          error: "ApiDojo upstream error",
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
      JSON.stringify({ error: "ApiDojo proxy request failed" }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
