import { QueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  QuotePageData,
  QuotePageFinancialData,
  QuotePageSidebarAboutData,
  QuotePageSidebarData,
  quoteType,
  utils,
} from "./types";

// YH Finance is the primary API for quotes
import { ENDPOINTS, yhFetch } from "../../config/api";
import { cacheStorage } from "../../services/storage";
import { isDemoActive } from "../../data/demo/demoState";
import { DEMO_QUOTES, DEMO_GAINERS, DEMO_LOSERS, DEMO_MOST_ACTIVE, DEMO_TRENDING } from "../../data/demo";
import { DEMO_QUOTE_PAGE_DATA } from "../../data/demo";

// Cache TTLs for localStorage persistence (survive page refreshes)
const LS_TTL = {
  quote: ENDPOINTS.batchQuotes.cache.gc,   // 5 min
  quotePageData: 10 * 60_000,              // 10 min
  movers: ENDPOINTS.movers.cache.gc,       // 5 min
  trending: ENDPOINTS.trending.cache.gc,   // 5 min
} as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseQuote(q: any, fallbackSymbol?: string): quoteType {
  // Yahoo Finance 166 — quoteSummary format (nested {raw, fmt} objects)
  if (q.price?.regularMarketPrice?.raw !== undefined) {
    const p = q.price;
    return {
      symbol: (p.symbol ?? fallbackSymbol ?? "").toLowerCase(),
      price: p.regularMarketPrice?.raw ?? 0,
      name: p.shortName ?? p.longName ?? "",
      priceChange: Number((p.regularMarketChange?.raw ?? 0).toFixed(2)),
      percentChange: p.regularMarketChangePercent?.raw
        ? p.regularMarketChangePercent.raw * 100
        : 0,
    };
  }

  // Old YH Finance format (flat keys) or flat yahoo-finance166 format
  return {
    symbol: (q.symbol ?? fallbackSymbol ?? "").toLowerCase(),
    price: q.regularMarketPrice ?? 0,
    name: q.shortName ?? q.longName ?? "",
    priceChange: Number((q.regularMarketChange ?? 0).toFixed(2)),
    percentChange: q.regularMarketChangePercent ?? 0,
  };
}

/**
 * Fetch quotes for multiple symbols in a single API call via YH Finance.
 * Returns a map of symbol → quoteType.
 * Symbols already in the React Query cache are returned from cache
 * and excluded from the network request.
 *
 * YH Finance accepts standard tickers (AAPL, ^DJI, ^GSPC, etc.)
 * directly — no ID mapping needed.
 */
export const getBatchQuotes = async (
  queryClient: QueryClient,
  symbols: string[]
): Promise<Record<string, quoteType | null>> => {
  // Demo mode: return static data immediately
  if (isDemoActive()) {
    const result: Record<string, quoteType | null> = {};
    for (const sym of symbols) {
      result[sym] = DEMO_QUOTES[sym] ?? DEMO_QUOTES[sym.toUpperCase()] ?? null;
    }
    return result;
  }

  const result: Record<string, quoteType | null> = {};
  const uncached: string[] = [];

  // 1. Drain React Query in-memory cache first
  for (const sym of symbols) {
    const cached = queryClient.getQueryData(["quote", sym]);
    if (cached) {
      result[sym] = utils.checkCachedQuoteType(cached);
    } else {
      uncached.push(sym);
    }
  }

  if (uncached.length === 0) return result;

  // 2. Check localStorage for symbols not in memory (survives refresh)
  const stillUncached: string[] = [];
  for (const sym of uncached) {
    const lsCached = cacheStorage.get<quoteType>(`quote_${sym}`, LS_TTL.quote);
    if (lsCached) {
      result[sym] = lsCached;
      queryClient.setQueryData(["quote", sym], lsCached);
    } else {
      stillUncached.push(sym);
    }
  }

  if (stillUncached.length === 0) return result;

  // 3. Batch fetch remaining symbols in one Yahoo Finance call
  try {
    const symbolsParam = stillUncached.join(",");
    const response = await yhFetch(ENDPOINTS.batchQuotes.path, {
      region: "US",
      symbols: symbolsParam,
    });

    // Handle both response formats:
    // Old yh-finance: quoteResponse.result[]
    // New yahoo-finance166: quoteSummary.result[] (with nested price objects) or quoteResponse.result[]
    const rawQuotes =
      response.data?.quoteResponse?.result ??
      response.data?.quoteSummary?.result ??
      [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bySymbol: Record<string, any> = {};
    for (const q of rawQuotes) {
      // Handle both formats: flat q.symbol or nested q.price.symbol
      const sym = q.symbol ?? q.price?.symbol;
      if (sym) {
        bySymbol[sym] = q;
      }
    }

    for (const sym of stillUncached) {
      const raw = bySymbol[sym] ?? bySymbol[sym.toUpperCase()];
      if (raw) {
        const parsed = parseQuote(raw, sym);
        result[sym] = parsed;
        queryClient.setQueryData(["quote", sym], parsed);
        cacheStorage.set(`quote_${sym}`, parsed);
      } else {
        result[sym] = null;
      }
    }
  } catch (error) {
    console.error("getBatchQuotes YH error:", error);
    for (const sym of stillUncached) {
      result[sym] = null;
    }
  }

  return result;
};

const stateAbbreviations: { [key: string]: string } = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
};
const getStateFullName = (abbreviation: string): string | undefined => {
  return stateAbbreviations[abbreviation.toUpperCase()];
};

export const getQuote = async (
  queryClient: QueryClient,
  symbol: string,
  retryCount: number = 0
): Promise<quoteType | null> => {
  // Demo mode fallback
  if (isDemoActive()) {
    return DEMO_QUOTES[symbol] ?? DEMO_QUOTES[symbol.toUpperCase()] ?? null;
  }

  try {
    const cachedQuote = queryClient.getQueryData(["quote", symbol]);
    if (cachedQuote) {
      const newCachedQuote = utils.checkCachedQuoteType(cachedQuote);
      return newCachedQuote;
    }

    const response = await yhFetch(ENDPOINTS.batchQuotes.path, {
      region: "US",
      symbols: symbol,
    });

    // Handle both response formats
    const q =
      response.data?.quoteResponse?.result?.[0] ??
      response.data?.quoteSummary?.result?.[0];
    if (!q) throw new Error("No quote data returned");

    const quoteData: quoteType = parseQuote(q, symbol);

    queryClient.setQueryData(["quote", symbol], quoteData);
    return quoteData;
  } catch (error) {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 429 &&
      retryCount < 2
    ) {
      const delay = 750;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return getQuote(queryClient, symbol, retryCount + 1);
    }
    return null;
  }
};

export const getQuotePageData = async (
  queryClient: QueryClient,
  symbol: string,
  isIndex?: boolean
): Promise<QuotePageData | null> => {
  const inDemo = isDemoActive();
  const sym = symbol.toUpperCase();

  // Demo mode: use known demo data as baseline, but still fetch about/profile
  // from API for unknown symbols (can't fake About/CEO convincingly)
  if (inDemo) {
    const knownDemo = DEMO_QUOTE_PAGE_DATA[sym];
    if (knownDemo) {
      // Known demo symbol — use cached data, no API calls needed
      return knownDemo;
    }

    // Unknown symbol in demo mode — try fetching quote + about from API
    // (limited API usage: 2 calls max for quote data + profile)
    try {
      const response = await yhFetch(ENDPOINTS.batchQuotes.path, {
        region: "US",
        symbols: symbol,
      });

      const q =
        response.data?.quoteResponse?.result?.[0] ??
        response.data?.quoteSummary?.result?.[0];

      if (q) {
        const quoteData: quoteType = parseQuote(q, symbol);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawVal = (v: any): number | undefined =>
          v?.raw !== undefined ? v.raw : typeof v === "number" ? v : undefined;
        const priceData = q.price ?? q;
        const summaryDetail = q.summaryDetail ?? q;

        const quoteSidebarData: QuotePageSidebarData = {
          previousClose: (() => {
            const v = rawVal(priceData.regularMarketPreviousClose) ?? rawVal(summaryDetail.previousClose);
            return v ? `$${v}` : "";
          })(),
          dayRange: (() => {
            const lo = rawVal(priceData.regularMarketDayLow) ?? rawVal(summaryDetail.dayLow);
            const hi = rawVal(priceData.regularMarketDayHigh) ?? rawVal(summaryDetail.dayHigh);
            if (lo && hi) return `$${lo} - $${hi}`;
            return priceData.regularMarketDayRange ?? summaryDetail.dayRange ?? "";
          })(),
          fiftyTwoWeekRange: (() => {
            const lo = rawVal(summaryDetail.fiftyTwoWeekLow) ?? rawVal(priceData.fiftyTwoWeekLow);
            const hi = rawVal(summaryDetail.fiftyTwoWeekHigh) ?? rawVal(priceData.fiftyTwoWeekHigh);
            if (lo && hi) return `$${lo} - $${hi}`;
            if (hi) return `$${hi}`;
            return "";
          })(),
          marketCap: (() => {
            const v = rawVal(priceData.marketCap) ?? rawVal(summaryDetail.marketCap);
            return v ? formatLargeNumber(v) : "";
          })(),
          volume: (() => {
            const v = rawVal(priceData.regularMarketVolume) ?? rawVal(summaryDetail.volume);
            return v ? formatLargeNumber(v) : "";
          })(),
          average3MonthVolume: (() => {
            const v = rawVal(priceData.averageDailyVolume3Month) ?? rawVal(summaryDetail.averageVolume);
            return v ? formatLargeNumber(v) : "";
          })(),
          trailingPE: (() => {
            const v = rawVal(summaryDetail.trailingPE) ?? rawVal(priceData.trailingPE);
            return v ? `${v.toFixed(2)}` : "";
          })(),
          dividendYield: (() => {
            const v = rawVal(summaryDetail.dividendYield) ?? rawVal(priceData.dividendYield);
            return v ? `${(v * 100).toFixed(2)}%` : "";
          })(),
          primaryExchange: priceData.fullExchangeName ?? priceData.exchangeName ?? "",
        };

        // In demo mode, also fetch profile/about (can't fake CEO/description)
        let quoteSidebarAboutData: QuotePageSidebarAboutData = {
          summary: "", website: "", headquarters: "", employees: "", ceo: "",
        };
        let quoteFinancialData: QuotePageFinancialData = {
          annualRevenue: "", netIncome: "", netProfitMargin: "", ebitda: "",
        };

        if (!isIndex) {
          try {
            const profileRes = await yhFetch(ENDPOINTS.profile.path, {
              symbol,
              region: "US",
            });
            const d = profileRes.data ?? {};
            const result0 = d.quoteSummary?.result?.[0] ?? {};
            const profile = result0.assetProfile ?? d.summaryProfile ?? d.assetProfile;
            if (profile) {
              const officers = profile.companyOfficers ?? [];
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const ceoEntry = officers.find((o: any) =>
                (o.title ?? "").toLowerCase().includes("ceo") ||
                (o.title ?? "").toLowerCase().includes("chief executive")
              );
              quoteSidebarAboutData = {
                summary: profile.longBusinessSummary ?? "",
                website: profile.website ?? "",
                headquarters: `${profile.city || ""}, ${getStateFullName(profile.state ?? "") || ""} ${profile.country || ""}`.trim(),
                employees: profile.fullTimeEmployees
                  ? `${typeof profile.fullTimeEmployees === "object" ? profile.fullTimeEmployees.longFmt ?? profile.fullTimeEmployees.fmt ?? profile.fullTimeEmployees.raw : profile.fullTimeEmployees.toLocaleString()}`
                  : "",
                ceo: ceoEntry?.name ?? "",
              };
            }
            // Skip financial data in demo — can be generated to save API calls
          } catch (err) {
            console.warn(`[Finch] Demo profile fetch failed for ${symbol}:`, err);
          }
        }

        const quotePageData: QuotePageData = {
          quoteData,
          quoteSidebarData,
          quoteSidebarAboutData,
          quoteFinancialData,
        };
        queryClient.setQueryData(["quotePageData", symbol], quotePageData);
        return quotePageData;
      }
    } catch (err) {
      console.warn(`[Finch] Demo quote fetch failed for ${symbol}:`, err);
    }

    // API calls failed — return minimal placeholder so page isn't blank
    return {
      quoteData: {
        symbol: symbol.toLowerCase(),
        name: sym,
        price: 0,
        priceChange: 0,
        percentChange: 0,
      },
      quoteSidebarData: {
        previousClose: "",
        dayRange: "",
        fiftyTwoWeekRange: "",
        marketCap: "",
        volume: "",
        average3MonthVolume: "",
        trailingPE: "",
        dividendYield: "",
        primaryExchange: "",
      },
      quoteSidebarAboutData: {
        summary: "",
        website: "",
        headquarters: "",
        employees: "",
        ceo: "",
      },
      quoteFinancialData: {
        annualRevenue: "",
        netIncome: "",
        netProfitMargin: "",
        ebitda: "",
      },
    };
  }

  try {
    // Check localStorage first (only cached when profile data was present)
    const lsCached = cacheStorage.get<QuotePageData>(`quotePageData_${symbol}`, LS_TTL.quotePageData);
    if (lsCached) {
      queryClient.setQueryData(["quotePageData", symbol], lsCached);
      return lsCached;
    }

    // Check react-query cache — but only if it has meaningful financial data.
    // Without this guard, a failed profile fetch gets cached with empty
    // financials and the queryFn never retries.
    const cachedQuote = queryClient.getQueryData([
      "quotePageData",
      symbol,
    ]) as QuotePageData | undefined;
    if (
      cachedQuote &&
      (cachedQuote.quoteFinancialData?.annualRevenue ||
        cachedQuote.quoteSidebarAboutData?.summary ||
        isIndex)
    ) {
      return cachedQuote;
    }

    // Fetch basic quote data via batch quotes endpoint (1 symbol)
    const response = await yhFetch(ENDPOINTS.batchQuotes.path, {
      region: "US",
      symbols: symbol,
    });

    // Handle both response formats
    const q =
      response.data?.quoteResponse?.result?.[0] ??
      response.data?.quoteSummary?.result?.[0];
    if (!q) throw new Error("No quote data returned");

    const quoteData: quoteType = parseQuote(q, symbol);

    // Helper to extract value from flat or nested {raw, fmt} format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawVal = (v: any): number | undefined =>
      v?.raw !== undefined ? v.raw : typeof v === "number" ? v : undefined;

    // For quoteSummary format, data may be in q.price or q.summaryDetail
    const priceData = q.price ?? q;
    const summaryDetail = q.summaryDetail ?? q;

    // Populate sidebar from the flat or nested quote response
    const quoteSidebarData: QuotePageSidebarData = isIndex
      ? {
          previousClose: "",
          dayRange: "",
          fiftyTwoWeekRange: "",
          marketCap: "",
          volume: "",
          average3MonthVolume: "",
          trailingPE: "",
          dividendYield: "",
          primaryExchange: "",
        }
      : {
          previousClose: (() => {
            const v = rawVal(priceData.regularMarketPreviousClose) ?? rawVal(summaryDetail.previousClose);
            return v ? `$${v}` : "";
          })(),
          dayRange: (() => {
            const lo = rawVal(priceData.regularMarketDayLow) ?? rawVal(summaryDetail.dayLow);
            const hi = rawVal(priceData.regularMarketDayHigh) ?? rawVal(summaryDetail.dayHigh);
            if (lo && hi) return `$${lo} - $${hi}`;
            return priceData.regularMarketDayRange ?? summaryDetail.dayRange ?? "";
          })(),
          fiftyTwoWeekRange: (() => {
            const lo = rawVal(summaryDetail.fiftyTwoWeekLow) ?? rawVal(priceData.fiftyTwoWeekLow);
            const hi = rawVal(summaryDetail.fiftyTwoWeekHigh) ?? rawVal(priceData.fiftyTwoWeekHigh);
            if (lo && hi) return `$${lo} - $${hi}`;
            if (hi) return `$${hi}`;
            return "";
          })(),
          marketCap: (() => {
            const v = rawVal(priceData.marketCap) ?? rawVal(summaryDetail.marketCap);
            return v ? formatLargeNumber(v) : "";
          })(),
          volume: (() => {
            const v = rawVal(priceData.regularMarketVolume) ?? rawVal(summaryDetail.volume);
            return v ? formatLargeNumber(v) : "";
          })(),
          average3MonthVolume: (() => {
            const v = rawVal(priceData.averageDailyVolume3Month) ?? rawVal(summaryDetail.averageVolume);
            return v ? formatLargeNumber(v) : "";
          })(),
          trailingPE: (() => {
            const v = rawVal(summaryDetail.trailingPE) ?? rawVal(priceData.trailingPE);
            return v ? `${v.toFixed(2)}` : "";
          })(),
          dividendYield: (() => {
            const v = rawVal(summaryDetail.dividendYield) ?? rawVal(priceData.dividendYield);
            return v ? `${(v * 100).toFixed(2)}%` : "";
          })(),
          primaryExchange: priceData.fullExchangeName ?? priceData.exchangeName ?? "",
        };

    // Profile data requires a separate call
    let quoteSidebarAboutData: QuotePageSidebarAboutData = {
      summary: "",
      website: "",
      headquarters: "",
      employees: "",
      ceo: "",
    };
    let quoteFinancialData: QuotePageFinancialData = {
      annualRevenue: "",
      netIncome: "",
      netProfitMargin: "",
      ebitda: "",
    };

    if (!isIndex) {
      try {
        const profileRes = await yhFetch(ENDPOINTS.profile.path, {
          symbol,
          region: "US",
        });

        const d = profileRes.data ?? {};

        // yahoo-finance166: /api/stock/get-financial-data returns quoteSummary.result[]
        // Also try assetProfile, summaryProfile for backward compat
        const result0 = d.quoteSummary?.result?.[0] ?? {};
        const profile =
          result0.assetProfile ??
          d.summaryProfile ??
          d.assetProfile;
        if (profile) {
          // Extract CEO from companyOfficers array
          const officers = profile.companyOfficers ?? [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const ceoEntry = officers.find((o: any) =>
            (o.title ?? "").toLowerCase().includes("ceo") ||
            (o.title ?? "").toLowerCase().includes("chief executive")
          );

          quoteSidebarAboutData = {
            summary: profile.longBusinessSummary ?? "",
            website: profile.website ?? "",
            headquarters: `${profile.city || ""}, ${getStateFullName(profile.state ?? "") || ""} ${profile.country || ""}`.trim(),
            employees: profile.fullTimeEmployees
              ? `${typeof profile.fullTimeEmployees === "object" ? profile.fullTimeEmployees.longFmt ?? profile.fullTimeEmployees.fmt ?? profile.fullTimeEmployees.raw : profile.fullTimeEmployees.toLocaleString()}`
              : "",
            ceo: ceoEntry?.name ?? "",
          };
        }

        const fin =
          result0.financialData ??
          d.financialData;
        const keyStats = result0.defaultKeyStatistics ?? d.defaultKeyStatistics;
        if (fin) {
          quoteFinancialData = {
            annualRevenue: fin.totalRevenue?.fmt ?? "",
            netIncome: keyStats?.netIncomeToCommon?.fmt ?? fin.netIncomeToCommon?.fmt ?? "",
            netProfitMargin: fin.profitMargins?.fmt ?? keyStats?.profitMargins?.fmt ?? "",
            ebitda: fin.ebitda?.fmt ?? "",
          };
        }
      } catch (err) {
        console.warn(`[Finch] Profile fetch failed for ${symbol}:`, err);
      }
    }

    const quotePageData: QuotePageData = {
      quoteData,
      quoteSidebarData,
      quoteSidebarAboutData,
      quoteFinancialData,
    };
    queryClient.setQueryData(["quotePageData", symbol], quotePageData);
    // Only persist to localStorage if we got meaningful profile data
    // (avoids caching empty about/financial data from a failed profile fetch)
    const hasProfileData = quoteSidebarAboutData.summary || quoteFinancialData.annualRevenue;
    if (hasProfileData) {
      cacheStorage.set(`quotePageData_${symbol}`, quotePageData);
    }
    return quotePageData;
  } catch (error) {
    // Re-throw so React Query treats it as an error (shows error state + retry)
    throw error;
  }
};

/** Format large numbers like marketCap into human-readable strings */
function formatLargeNumber(num: number): string {
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return `${num}`;
}

export interface Symbols {
  symbols: string;
}

export const getMoversSymbols = async (
  title: string,
  queryClient?: QueryClient
): Promise<string[]> => {
  // Map UI title strings to canonical names and endpoint paths
  let canonicalName = "MOST_ACTIVES";
  let endpointPath: string = ENDPOINTS.moversActive.path;
  let endpointParams: Record<string, string | number> = { ...ENDPOINTS.moversActive.params };
  if (title === "active") {
    canonicalName = "MOST_ACTIVES";
    endpointPath = ENDPOINTS.moversActive.path;
    endpointParams = { ...ENDPOINTS.moversActive.params };
  } else if (title === "losers") {
    canonicalName = "DAY_LOSERS";
    endpointPath = ENDPOINTS.moversLosers.path;
    endpointParams = { ...ENDPOINTS.moversLosers.params };
  } else {
    canonicalName = "DAY_GAINERS";
    endpointPath = ENDPOINTS.moversGainers.path;
    endpointParams = { ...ENDPOINTS.moversGainers.params };
  }

  // Demo mode fallback
  if (isDemoActive()) {
    const demoMap: Record<string, typeof DEMO_GAINERS> = {
      DAY_GAINERS: DEMO_GAINERS,
      DAY_LOSERS: DEMO_LOSERS,
      MOST_ACTIVES: DEMO_MOST_ACTIVE,
    };
    return (demoMap[canonicalName] ?? DEMO_GAINERS).map((d) => d.symbol);
  }

  // Check cache first — avoid refetching on every tab switch
  if (queryClient) {
    const cached = queryClient.getQueryData<string[]>(["movers", canonicalName]);
    if (cached && cached.length > 0) return cached;
  }

  // Check localStorage (survives refresh)
  const lsCached = cacheStorage.get<string[]>(`movers_${canonicalName}`, LS_TTL.movers);
  if (lsCached && lsCached.length > 0) {
    if (queryClient) queryClient.setQueryData(["movers", canonicalName], lsCached);
    return lsCached;
  }

  try {
    // yahoo-finance166 has separate endpoints per mover category
    const response = await yhFetch(endpointPath, {
      ...endpointParams,
    });

    // Response may be: finance.result[0].quotes[] or quoteSummary.result[]
    const finResults = response.data?.finance?.result ?? [];
    const quoteSummaryResults = response.data?.quoteSummary?.result ?? [];

    // Extract quotes from whichever format we got
    let quotes: any[] = [];
    if (finResults.length > 0) {
      // Old format: { finance: { result: [{ quotes: [...] }] } }
      for (const cat of finResults) {
        quotes = quotes.concat(cat?.quotes ?? []);
      }
    } else if (quoteSummaryResults.length > 0) {
      // quoteSummary format — each result item IS a quote
      quotes = quoteSummaryResults;
    }

    const topQuotes = quotes.slice(0, 5);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const symbols: string[] = topQuotes
      .map((q: any) => q.symbol ?? q.price?.symbol)
      .filter(Boolean);

    // Cache results
    if (queryClient) {
      queryClient.setQueryData(["movers", canonicalName], symbols);
      cacheStorage.set(`movers_${canonicalName}`, symbols);
      // Pre-cache individual quote data
      for (const q of topQuotes) {
        const sym = q.symbol ?? q.price?.symbol;
        if (sym) {
          const parsed = parseQuote(q, sym);
          queryClient.setQueryData(["quote", sym], parsed);
          cacheStorage.set(`quote_${sym}`, parsed);
        }
      }
    }

    return symbols;
  } catch (error) {
    return [];
  }
};

export const getTrending = async (queryClient: QueryClient) => {
  // Demo mode fallback
  if (isDemoActive()) return DEMO_TRENDING;

  const cachedData = queryClient.getQueryData(["trending"]);
  if (cachedData) return cachedData;

  // Check localStorage (survives refresh)
  const lsCached = cacheStorage.get("trending", LS_TTL.trending);
  if (lsCached) {
    queryClient.setQueryData(["trending"], lsCached);
    return lsCached;
  }

  try {
    const response = await yhFetch(ENDPOINTS.trending.path, {
      ...ENDPOINTS.trending.params,
    });

    // yahoo-finance166 trending: might return quoteSummary.result[] or finance.result[].quotes[]
    let symbols: string[] = [];
    const finResults = response.data?.finance?.result ?? [];
    const quoteSummaryResults = response.data?.quoteSummary?.result ?? [];

    if (finResults.length > 0) {
      const rawQuotes = finResults[0]?.quotes ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      symbols = rawQuotes.slice(0, 10).map((q: any) => q.symbol);
    } else if (quoteSummaryResults.length > 0) {
      // quoteSummary format: each result has price.symbol
      symbols = quoteSummaryResults
        .slice(0, 10)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((q: any) => q.symbol ?? q.price?.symbol)
        .filter(Boolean);
    }

    if (symbols.length === 0) return [];

    // Trending endpoint only returns symbols — fetch full quote data
    const quotesMap = await getBatchQuotes(queryClient, symbols);
    const trendingQuotes = symbols
      .map((sym: string, idx: number) => {
        const q = quotesMap[sym];
        return {
          id: idx + 1,
          symbol: sym,
          name: q?.name ?? "",
          price: q?.price ?? 0,
          priceChange: Number((q?.priceChange ?? 0)).toFixed(2),
          percentChange: Number((q?.percentChange ?? 0)).toFixed(2),
        };
      })
      // Filter out symbols with no data (price=0 means API didn't return data)
      .filter((q: { price: number }) => q.price !== 0);

    queryClient.setQueryData(["trending"], trendingQuotes);
    cacheStorage.set("trending", trendingQuotes);
    return trendingQuotes;
  } catch (error) {
    return [];
  }
};
