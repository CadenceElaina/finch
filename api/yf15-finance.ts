/**
 * Vercel Edge Function — Yahoo Finance 15 Fallback API Proxy
 * ──────────────────────────────────────────────────────────
 * Proxies requests to yahoo-finance15.p.rapidapi.com.
 * Called when the primary YH166 API is exhausted (429/403).
 *
 * The client sends the ORIGINAL YH166 endpoint + params.
 * This proxy maps them to YF15 equivalents and normalizes
 * the response to match the YH166 format callers expect.
 *
 * Usage: GET /api/yf15-finance?endpoint=/api/market/get-quote&symbols=AAPL,MSFT
 *
 * IMPORTANT: Normalizers match the ACTUAL YF15 API shapes (tested Feb 2026),
 * not the documentation samples.
 */

export const config = {
  runtime: "edge",
};

const YF15_HOST = "yahoo-finance15.p.rapidapi.com";

// ── Known asset types ────────────────────────────────────

const KNOWN_ETFS = new Set([
  "SPY", "QQQ", "DIA", "IWM", "VTI", "VOO", "VEA", "VWO", "EFA",
  "AGG", "BND", "LQD", "HYG", "TLT", "IEF", "SHY", "GLD", "SLV",
  "USO", "XLF", "XLK", "XLE", "XLV", "XLI", "XLY", "XLP", "XLB",
  "XLU", "XLRE", "XLC", "ARKK", "ARKG", "ARKW", "ARKF", "ARKQ",
  "SCHD", "JEPI", "JEPQ", "VIG", "VYM", "DVY",
]);

const INDEX_SYMBOLS = new Set(["^DJI", "^GSPC", "^IXIC", "^RUT", "^VIX", "^TNX"]);

// ── Parse helpers ────────────────────────────────────────

function parseDollar(s: string | number | undefined | null): number {
  if (s == null) return 0;
  if (typeof s === "number") return s;
  return parseFloat(String(s).replace(/[$,]/g, "")) || 0;
}

function parsePercent(s: string | number | undefined | null): number {
  if (s == null) return 0;
  if (typeof s === "number") return s;
  return parseFloat(String(s).replace(/%/g, "")) || 0;
}

function parseVolume(s: string | number | undefined | null): number {
  if (s == null) return 0;
  if (typeof s === "number") return s;
  return parseInt(String(s).replace(/,/g, ""), 10) || 0;
}

function getAssetType(symbol: string): string {
  return KNOWN_ETFS.has(symbol.toUpperCase()) ? "ETF" : "STOCKS";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeQuoteBody(body: any, fallbackSymbol: string): Record<string, unknown> {
  const pd = body.primaryData ?? {};
  const ks = body.keyStats ?? {};

  let fiftyTwoWeekLow = 0;
  let fiftyTwoWeekHigh = 0;
  const rangeStr: string = ks.fiftyTwoWeekHighLow?.value ?? "";
  if (rangeStr.includes("-")) {
    const parts = rangeStr.split("-").map((s: string) => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      fiftyTwoWeekLow = parts[0];
      fiftyTwoWeekHigh = parts[1];
    }
  }

  return {
    symbol: body.symbol ?? fallbackSymbol,
    shortName: (body.companyName ?? "")
      .replace(/ Common Stock$/i, "")
      .replace(/ - Common Stock$/i, ""),
    regularMarketPrice: parseDollar(pd.lastSalePrice),
    regularMarketChange: parseFloat(String(pd.netChange ?? "0")) || 0,
    regularMarketChangePercent: parsePercent(pd.percentageChange),
    regularMarketVolume: parseVolume(pd.volume),
    fiftyTwoWeekLow,
    fiftyTwoWeekHigh,
    fullExchangeName: body.exchange ?? "",
    quoteType: body.assetClass === "ETF" ? "ETF" : "EQUITY",
  };
}

// ── Upstream fetch helper ────────────────────────────────

async function yf15Get(path: string, params: Record<string, string>, apiKey: string) {
  const url = new URL(`https://${YF15_HOST}${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const resp = await fetch(url.toString(), {
    headers: {
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": YF15_HOST,
    },
  });
  if (!resp.ok) throw new Error(`YF15 ${resp.status}`);
  return resp.json();
}

/**
 * Fetch a single ticker quote. Tries predicted type, then alternate.
 */
async function fetchSingleQuote(
  symbol: string,
  apiKey: string
): Promise<Record<string, unknown> | null> {
  if (INDEX_SYMBOLS.has(symbol)) return null;

  const type = getAssetType(symbol);

  try {
    const data = await yf15Get("/api/v1/markets/quote", { ticker: symbol, type }, apiKey);
    const body = data?.body;

    if (body && !Array.isArray(body)) {
      return normalizeQuoteBody(body, symbol);
    }

    // Try alternate type
    if (!body || (Array.isArray(body) && body.length === 0)) {
      const altType = type === "STOCKS" ? "ETF" : "STOCKS";
      const altData = await yf15Get("/api/v1/markets/quote", { ticker: symbol, type: altType }, apiKey);
      const altBody = altData?.body;
      if (altBody && !Array.isArray(altBody)) {
        return normalizeQuoteBody(altBody, symbol);
      }
    }

    return null;
  } catch {
    return null;
  }
}

// ── Endpoint handlers ────────────────────────────────────

type Handler = (params: Record<string, string>, apiKey: string) => Promise<unknown>;

const HANDLERS: Record<string, Handler> = {
  "/api/market/get-quote": async (params, apiKey) => {
    const symbols = (params.symbols ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (symbols.length === 0) {
      return { quoteResponse: { result: [] } };
    }

    const results = await Promise.all(symbols.map((sym) => fetchSingleQuote(sym, apiKey)));
    return { quoteResponse: { result: results.filter(Boolean) } };
  },

  "/api/autocomplete": async (params, apiKey) => {
    return yf15Get("/api/v1/markets/search", { search: params.query ?? "" }, apiKey);
  },

  "/api/stock/get-chart": async (params, apiKey) => {
    const data = await yf15Get(
      "/api/v2/markets/stock/history",
      {
        symbol: params.symbol ?? "",
        interval: params.interval ?? "1d",
        diffandsplits: "false",
      },
      apiKey
    );

    const meta = data?.meta ?? {};
    const body: Array<{
      timestamp_unix: number;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }> = Array.isArray(data?.body) ? data.body : [];

    const timestamps: number[] = [];
    const opens: number[] = [];
    const highs: number[] = [];
    const lows: number[] = [];
    const closes: number[] = [];
    const volumes: number[] = [];

    for (const item of body) {
      timestamps.push(item.timestamp_unix);
      opens.push(item.open);
      highs.push(item.high);
      lows.push(item.low);
      closes.push(item.close);
      volumes.push(item.volume);
    }

    return {
      chart: {
        result: [
          {
            meta: {
              currency: "USD",
              symbol: meta.ticker ?? params.symbol ?? "",
              regularMarketPrice: closes[closes.length - 1] ?? 0,
              previousClose: 0,
            },
            timestamp: timestamps,
            indicators: {
              quote: [
                {
                  open: opens,
                  high: highs,
                  low: lows,
                  close: closes,
                  volume: volumes,
                },
              ],
            },
          },
        ],
      },
    };
  },

  "/api/market/get-trending": async (_params, apiKey) => {
    const data = await yf15Get(
      "/api/v2/markets/tickers",
      { page: "1", type: "STOCKS" },
      apiKey
    );
    const body = Array.isArray(data?.body) ? data.body : [];
    const quotes = body.slice(0, 25).map((item: { symbol?: string }) => ({
      symbol: item.symbol ?? "",
    }));
    return { finance: { result: [{ quotes }] } };
  },
};

// Cache-Control headers per YH166 endpoint
const CACHE_HEADERS: Record<string, string> = {
  "/api/market/get-quote": "s-maxage=30, stale-while-revalidate=60",
  "/api/autocomplete": "s-maxage=86400, stale-while-revalidate=3600",
  "/api/stock/get-chart": "s-maxage=300, stale-while-revalidate=120",
  "/api/market/get-trending": "s-maxage=60, stale-while-revalidate=30",
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

  if (!endpoint || !HANDLERS[endpoint]) {
    return new Response(
      JSON.stringify({
        error: "Invalid or unmapped endpoint for YF15 fallback",
        supported: Object.keys(HANDLERS),
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

  try {
    const normalized = await HANDLERS[endpoint](originalParams, apiKey);
    const cacheControl = CACHE_HEADERS[endpoint] ?? "s-maxage=60";

    return new Response(JSON.stringify(normalized), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": cacheControl,
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "YF15 proxy request failed" }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
