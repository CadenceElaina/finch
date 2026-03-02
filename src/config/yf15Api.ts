/**
 * Yahoo Finance 15 — Fallback API Configuration
 * ──────────────────────────────────────────────
 * Third-tier fallback provider when YH Finance 166 is exhausted.
 *
 * Provider : Yahoo Finance 15 via RapidAPI
 * Host     : yahoo-finance15.p.rapidapi.com
 * Tier     : Free (Basic) — 500 req/month
 *
 * IMPORTANT: Response shapes differ significantly from YH166 AND
 * from the API documentation. All normalizers are based on actual
 * tested API responses (Feb 2026).
 *
 * Key constraints discovered through testing:
 *  - v1/markets/quote only supports ONE ticker at a time
 *  - v1/markets/quote requires a `type` param (STOCKS | ETF)
 *  - Prices come as formatted strings: "$264.18", "-8.77", "-3.21%"
 *  - v2/markets/stock/history returns body[] array, NOT items{} object
 *  - stock/modules endpoint is unreliable (ETFs fail, some modules redirect to HTML)
 */

import axios from "axios";

// ── Config ───────────────────────────────────────────────

export const YF15_API_HOST = "yahoo-finance15.p.rapidapi.com";

/** Same RapidAPI account key works for all providers */
export const YF15_API_KEY = (
  import.meta.env.VITE_YH_FINANCE_KEY ??
  import.meta.env.VITE_APIDOJO_YAHOO_KEY ??
  ""
) as string;

const yf15Headers = () => ({
  "x-rapidapi-host": YF15_API_HOST,
  "x-rapidapi-key": YF15_API_KEY,
});

// ── Known asset types (avoid double-fetch for type detection) ──

const KNOWN_ETFS = new Set([
  "SPY", "QQQ", "DIA", "IWM", "VTI", "VOO", "VEA", "VWO", "EFA",
  "AGG", "BND", "LQD", "HYG", "TLT", "IEF", "SHY", "GLD", "SLV",
  "USO", "XLF", "XLK", "XLE", "XLV", "XLI", "XLY", "XLP", "XLB",
  "XLU", "XLRE", "XLC", "ARKK", "ARKG", "ARKW", "ARKF", "ARKQ",
  "SCHD", "JEPI", "JEPQ", "VIG", "VYM", "DVY",
]);

/** Index symbols that YF15 cannot handle (^DJI, ^GSPC, etc.) */
const INDEX_SYMBOLS = new Set(["^DJI", "^GSPC", "^IXIC", "^RUT", "^VIX", "^TNX"]);

// ── Parse helpers for YF15's formatted strings ───────────

/** Strip $ and commas → number. "$264.18" → 264.18 */
function parseDollar(s: string | number | undefined | null): number {
  if (s == null) return 0;
  if (typeof s === "number") return s;
  return parseFloat(String(s).replace(/[$,]/g, "")) || 0;
}

/** Strip % → number. "-3.21%" → -3.21 */
function parsePercent(s: string | number | undefined | null): number {
  if (s == null) return 0;
  if (typeof s === "number") return s;
  return parseFloat(String(s).replace(/%/g, "")) || 0;
}

/** Strip commas → integer. "72,366,823" → 72366823 */
function parseVolume(s: string | number | undefined | null): number {
  if (s == null) return 0;
  if (typeof s === "number") return s;
  return parseInt(String(s).replace(/,/g, ""), 10) || 0;
}

/** Determine YF15 `type` param from symbol */
function getAssetType(symbol: string): string {
  return KNOWN_ETFS.has(symbol.toUpperCase()) ? "ETF" : "STOCKS";
}

// ── Single-ticker quote fetch & normalize ────────────────

/**
 * Normalize YF15 v1/markets/quote body into flat YH166-compatible object.
 *
 * Actual YF15 response shape (tested):
 * {
 *   symbol: "AAPL",
 *   companyName: "Apple Inc. Common Stock",
 *   primaryData: {
 *     lastSalePrice: "$264.18",
 *     netChange: "-8.77",
 *     percentageChange: "-3.21%",
 *     volume: "72,366,823"
 *   },
 *   keyStats: { fiftyTwoWeekHighLow: { value: "169.21 - 288.62" } },
 *   assetClass: "STOCKS" | "ETF"
 * }
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeQuoteBody(body: any, fallbackSymbol: string): Record<string, unknown> {
  const pd = body.primaryData ?? {};
  const ks = body.keyStats ?? {};

  // Parse "169.21 - 288.62" → [169.21, 288.62]
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

/**
 * Fetch a single ticker quote from YF15 v1/markets/quote.
 * Tries the predicted type first; if empty, retries the alternate type.
 * Returns null for index symbols or on failure.
 */
async function fetchSingleQuote(symbol: string): Promise<Record<string, unknown> | null> {
  if (INDEX_SYMBOLS.has(symbol)) return null;

  const url = `https://${YF15_API_HOST}/api/v1/markets/quote`;
  const type = getAssetType(symbol);

  try {
    const resp = await axios.get(url, {
      params: { ticker: symbol, type },
      headers: yf15Headers(),
    });

    const body = resp.data?.body;
    if (body && !Array.isArray(body)) {
      // Got a single-object response — success
      return normalizeQuoteBody(body, symbol);
    }

    // Empty or array body → try alternate type
    if (!body || (Array.isArray(body) && body.length === 0)) {
      const altType = type === "STOCKS" ? "ETF" : "STOCKS";
      const altResp = await axios.get(url, {
        params: { ticker: symbol, type: altType },
        headers: yf15Headers(),
      });
      const altBody = altResp.data?.body;
      if (altBody && !Array.isArray(altBody)) {
        return normalizeQuoteBody(altBody, symbol);
      }
    }

    return null;
  } catch (err) {
    console.warn(`[YF15] Failed to fetch quote for ${symbol}:`, err);
    return null;
  }
}

// ── Endpoint handlers ────────────────────────────────────

interface EndpointHandler {
  /** Execute the request (may make multiple YF15 API calls) */
  handle: (params: Record<string, string | number>) => Promise<unknown>;
}

const ENDPOINT_MAP: Record<string, EndpointHandler> = {
  /**
   * Batch quotes
   * YH166: GET /api/market/get-quote?symbols=AAPL,MSFT,SPY
   *   → { quoteResponse: { result: [{symbol, regularMarketPrice, shortName, ...}] } }
   *
   * YF15 only supports single ticker, so we split and fetch in parallel.
   * Index symbols (^DJI etc.) are skipped — YF15 doesn't support them.
   */
  "/api/market/get-quote": {
    handle: async (params) => {
      const symbolsStr = String(params.symbols ?? "");
      const symbols = symbolsStr
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      if (symbols.length === 0) {
        return { quoteResponse: { result: [] } };
      }

      const results = await Promise.all(symbols.map(fetchSingleQuote));
      const quotes = results.filter(Boolean);
      return { quoteResponse: { result: quotes } };
    },
  },

  /**
   * Search / autocomplete
   * YH166: GET /api/autocomplete?query=...&region=US → { quotes: [...] }
   * YF15:  GET /api/v1/markets/search?search=... → { body: [...] }
   *
   * Search.tsx already handles `d?.body` format, so pass-through works.
   */
  "/api/autocomplete": {
    handle: async (params) => {
      const resp = await axios.get(
        `https://${YF15_API_HOST}/api/v1/markets/search`,
        {
          params: { search: String(params.query ?? "") },
          headers: yf15Headers(),
        }
      );
      return resp.data;
    },
  },

  /**
   * Chart / price history
   * YH166: GET /api/stock/get-chart?symbol=X&interval=5m&range=1d
   *   → { chart: { result: [{ timestamp: [...], indicators: { quote: [{open,high,low,close,volume}] } }] } }
   *
   * YF15 actual response (tested):
   *   → { meta: { ticker, interval }, body: [{ timestamp_unix, open, high, low, close, volume }] }
   */
  "/api/stock/get-chart": {
    handle: async (params) => {
      const resp = await axios.get(
        `https://${YF15_API_HOST}/api/v2/markets/stock/history`,
        {
          params: {
            symbol: String(params.symbol ?? ""),
            interval: String(params.interval ?? "1d"),
            diffandsplits: "false",
          },
          headers: yf15Headers(),
        }
      );

      const data = resp.data;
      const meta = data?.meta ?? {};
      const body: Array<{
        timestamp_unix: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
      }> = Array.isArray(data?.body) ? data.body : [];

      // Convert body array to YH166 chart format
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
                symbol: meta.ticker ?? String(params.symbol ?? ""),
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
  },

  /**
   * Trending tickers
   * YH166: GET /api/market/get-trending → { finance: { result: [{ quotes: [{symbol}] }] } }
   * YF15:  GET /api/v2/markets/tickers → paginated list of all tickers
   *
   * Returns first page worth of symbols.
   */
  "/api/market/get-trending": {
    handle: async () => {
      const resp = await axios.get(
        `https://${YF15_API_HOST}/api/v2/markets/tickers`,
        {
          params: { page: "1", type: "STOCKS" },
          headers: yf15Headers(),
        }
      );

      const body = Array.isArray(resp.data?.body) ? resp.data.body : [];
      const quotes = body.slice(0, 25).map((item: { symbol?: string }) => ({
        symbol: item.symbol ?? "",
      }));

      return { finance: { result: [{ quotes }] } };
    },
  },
};

// ── Public API ───────────────────────────────────────────

/**
 * Attempt a request to Yahoo Finance 15 as a fallback.
 * Maps YH166 endpoints and normalizes responses so callers
 * see the same shapes they expect from YH166.
 *
 * @returns axios-like `{ data }` or throws if no mapping / network error
 */
export async function yf15Fetch(
  yh166Endpoint: string,
  yh166Params: Record<string, string | number> = {}
): Promise<{ data: unknown }> {
  const mapping = ENDPOINT_MAP[yh166Endpoint];

  if (!mapping) {
    throw new Error(`[YF15] No fallback mapping for endpoint: ${yh166Endpoint}`);
  }

  console.info(`[YF15 Fallback] ${yh166Endpoint}`, yh166Params);
  const data = await mapping.handle(yh166Params);
  return { data };
}

/**
 * Check whether we have a fallback mapping for a given YH166 endpoint.
 */
export function hasYf15Fallback(endpoint: string): boolean {
  return endpoint in ENDPOINT_MAP;
}
