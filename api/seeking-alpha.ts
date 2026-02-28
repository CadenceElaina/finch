/**
 * Vercel Edge Function — Seeking Alpha API Proxy
 * ────────────────────────────────────────────────
 * Proxies requests to seeking-alpha.p.rapidapi.com.
 * API key is stored as a Vercel environment variable.
 *
 * Usage: Client calls /api/seeking-alpha?endpoint=/news/v2/list&category=market-news::us-news
 */

export const config = {
  runtime: "edge",
};

const SA_HOST = "seeking-alpha.p.rapidapi.com";

// Allowlist of Seeking Alpha paths we proxy
const ALLOWED_PATHS = new Set([
  "/news/v2/list",
  "/news/v2/list-by-symbol",
  "/news/v2/list-trending",
  "/v2/auto-complete",
  "/symbols/get-chart",
  "/symbols/get-summary",
  "/symbols/get-profile",
  "/market/get-realtime-quotes",
]);

// Cache-Control headers per endpoint (seconds)
const CACHE_HEADERS: Record<string, string> = {
  "/news/v2/list": "s-maxage=600, stale-while-revalidate=300",
  "/news/v2/list-by-symbol": "s-maxage=600, stale-while-revalidate=300",
  "/news/v2/list-trending": "s-maxage=600, stale-while-revalidate=300",
  "/v2/auto-complete": "s-maxage=86400, stale-while-revalidate=3600",
  "/symbols/get-chart": "s-maxage=300, stale-while-revalidate=120",
  "/symbols/get-summary": "s-maxage=3600, stale-while-revalidate=600",
  "/symbols/get-profile": "s-maxage=3600, stale-while-revalidate=600",
  "/market/get-realtime-quotes": "s-maxage=30, stale-while-revalidate=60",
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

  if (!endpoint || !ALLOWED_PATHS.has(endpoint)) {
    return new Response(
      JSON.stringify({ error: "Invalid or missing endpoint parameter" }),
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

  // Build upstream URL — forward all query params except 'endpoint'
  const upstreamUrl = new URL(`https://${SA_HOST}${endpoint}`);
  for (const [key, value] of url.searchParams.entries()) {
    if (key !== "endpoint") {
      upstreamUrl.searchParams.set(key, value);
    }
  }

  try {
    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": SA_HOST,
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
