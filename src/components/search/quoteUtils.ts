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
import { YH_API_HOST, YH_API_KEY, ENDPOINTS } from "../../config/api";
import { cacheStorage } from "../../services/storage";
const YH_BASE = `https://${YH_API_HOST}`;
const yhHeaders = () => ({
  "X-RapidAPI-Key": YH_API_KEY,
  "X-RapidAPI-Host": YH_API_HOST,
});

// Cache TTLs for localStorage persistence (survive page refreshes)
const LS_TTL = {
  quote: ENDPOINTS.batchQuotes.cache.gc,   // 5 min
  quotePageData: 10 * 60_000,              // 10 min
  movers: ENDPOINTS.movers.cache.gc,       // 5 min
  trending: ENDPOINTS.trending.cache.gc,   // 5 min
} as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseQuote(q: any, fallbackSymbol?: string): quoteType {
  // YH Finance format (primary)
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

  // 3. Batch fetch remaining symbols in one YH Finance call
  try {
    const symbolsParam = stillUncached.join(",");
    const response = await axios.get(
      `${YH_BASE}${ENDPOINTS.batchQuotes.path}`,
      {
        params: { region: "US", symbols: symbolsParam },
        headers: yhHeaders(),
      }
    );

    const rawQuotes = response.data?.quoteResponse?.result ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bySymbol: Record<string, any> = {};
    for (const q of rawQuotes) {
      if (q.symbol) {
        bySymbol[q.symbol] = q;
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
  try {
    const cachedQuote = queryClient.getQueryData(["quote", symbol]);
    if (cachedQuote) {
      const newCachedQuote = utils.checkCachedQuoteType(cachedQuote);
      return newCachedQuote;
    }

    const response = await axios.get(
      `${YH_BASE}${ENDPOINTS.batchQuotes.path}`,
      { params: { region: "US", symbols: symbol }, headers: yhHeaders() }
    );

    const q = response.data?.quoteResponse?.result?.[0];
    if (!q) throw new Error("No quote data returned");

    const quoteData: quoteType = {
      symbol: q.symbol?.toLowerCase() ?? symbol.toLowerCase(),
      price: q.regularMarketPrice ?? 0,
      name: q.shortName ?? "",
      priceChange: Number((q.regularMarketChange ?? 0).toFixed(2)),
      percentChange: q.regularMarketChangePercent ?? 0,
    };

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
  try {
    const cachedQuote = queryClient.getQueryData([
      "quotePageData",
      symbol,
    ]) as QuotePageData;
    if (cachedQuote) return cachedQuote;

    // Check localStorage (survives refresh)
    const lsCached = cacheStorage.get<QuotePageData>(`quotePageData_${symbol}`, LS_TTL.quotePageData);
    if (lsCached) {
      queryClient.setQueryData(["quotePageData", symbol], lsCached);
      return lsCached;
    }

    // Fetch basic quote data via batch quotes endpoint (1 symbol)
    const response = await axios.get(
      `${YH_BASE}${ENDPOINTS.batchQuotes.path}`,
      { params: { region: "US", symbols: symbol }, headers: yhHeaders() }
    );

    const q = response.data?.quoteResponse?.result?.[0];
    if (!q) throw new Error("No quote data returned");

    const quoteData: quoteType = {
      symbol: q.symbol?.toLowerCase() ?? symbol.toLowerCase(),
      price: q.regularMarketPrice ?? 0,
      name: q.shortName ?? "",
      priceChange: Number((q.regularMarketChange ?? 0).toFixed(2)),
      percentChange: q.regularMarketChangePercent ?? 0,
    };

    // Populate sidebar from the flat quote response
    const quoteSidebarData: QuotePageSidebarData = isIndex
      ? {
          previousClose: "",
          dayRange: "",
          fiftyTwoWeekHigh: "",
          marketCap: "",
          average3MonthVolume: "",
          trailingPE: "",
          dividendYield: "",
          primaryExchange: "",
        }
      : {
          previousClose: q.regularMarketPreviousClose
            ? `$${q.regularMarketPreviousClose}`
            : "",
          dayRange:
            q.regularMarketDayLow && q.regularMarketDayHigh
              ? `$${q.regularMarketDayLow} - $${q.regularMarketDayHigh}`
              : q.regularMarketDayRange ?? "",
          fiftyTwoWeekHigh: q.fiftyTwoWeekHigh
            ? `${q.fiftyTwoWeekHigh}`
            : "",
          marketCap: q.marketCap ? formatLargeNumber(q.marketCap) : "",
          average3MonthVolume: q.averageDailyVolume3Month
            ? formatLargeNumber(q.averageDailyVolume3Month)
            : "",
          trailingPE: q.trailingPE ? `${q.trailingPE.toFixed(2)}` : "",
          dividendYield: q.dividendYield
            ? `${q.dividendYield.toFixed(2)}%`
            : "",
          primaryExchange: q.fullExchangeName ?? "",
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
        const profileRes = await axios.get(
          `${YH_BASE}${ENDPOINTS.profile.path}`,
          {
            params: { symbol, region: "US" },
            headers: yhHeaders(),
          }
        );

        const profile =
          profileRes.data?.quoteSummary?.result?.[0]?.assetProfile ??
          profileRes.data?.assetProfile;
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
              ? `${profile.fullTimeEmployees}`
              : "",
            ceo: ceoEntry?.name ?? "",
          };
        }

        const fin =
          profileRes.data?.quoteSummary?.result?.[0]?.financialData ??
          profileRes.data?.financialData;
        if (fin) {
          quoteFinancialData = {
            annualRevenue: fin.totalRevenue?.fmt ?? "",
            netIncome: fin.netIncomeToCommon?.fmt ?? "",
            netProfitMargin: fin.profitMargins?.fmt ?? "",
            ebitda: fin.ebitda?.fmt ?? "",
          };
        }
      } catch {
        // Profile call failed — keep empty defaults
      }
    }

    const quotePageData: QuotePageData = {
      quoteData,
      quoteSidebarData,
      quoteSidebarAboutData,
      quoteFinancialData,
    };
    queryClient.setQueryData(["quotePageData", symbol], quotePageData);
    cacheStorage.set(`quotePageData_${symbol}`, quotePageData);
    return quotePageData;
  } catch (error) {
    return null;
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
  // Map UI title strings to the canonicalName returned by /market/v2/get-movers
  let canonicalName = "MOST_ACTIVES";
  if (title === "active") canonicalName = "MOST_ACTIVES";
  else if (title === "losers") canonicalName = "DAY_LOSERS";
  else canonicalName = "DAY_GAINERS";

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
    const response = await axios.get(`${YH_BASE}${ENDPOINTS.movers.path}`, {
      params: { ...ENDPOINTS.movers.params },
      headers: yhHeaders(),
    });

    // Response shape: { finance: { result: [{ canonicalName, quotes: [...] }] } }
    const results = response.data?.finance?.result ?? [];

    // Cache ALL categories from this single API call to avoid re-fetching on tab switch
    if (queryClient) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const cat of results) {
        const catQuotes = (cat?.quotes ?? []).slice(0, 5);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const catSymbols: string[] = catQuotes.map((q: any) => q.symbol);
        queryClient.setQueryData(["movers", cat.canonicalName], catSymbols);
        cacheStorage.set(`movers_${cat.canonicalName}`, catSymbols);
        // Pre-cache individual quote data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const q of catQuotes) {
          if (q.symbol) {
            const parsed = parseQuote(q, q.symbol);
            queryClient.setQueryData(["quote", q.symbol], parsed);
            cacheStorage.set(`quote_${q.symbol}`, parsed);
          }
        }
      }
    }

    const category = results.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (r: any) => r.canonicalName === canonicalName
    );
    const quotes = category?.quotes ?? [];
    const topQuotes = quotes.slice(0, 5);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const symbols: string[] = topQuotes.map((q: any) => q.symbol);

    return symbols;
  } catch (error) {
    return [];
  }
};

export const getTrending = async (queryClient: QueryClient) => {
  const cachedData = queryClient.getQueryData(["trending"]);
  if (cachedData) return cachedData;

  // Check localStorage (survives refresh)
  const lsCached = cacheStorage.get("trending", LS_TTL.trending);
  if (lsCached) {
    queryClient.setQueryData(["trending"], lsCached);
    return lsCached;
  }

  try {
    const response = await axios.get(`${YH_BASE}${ENDPOINTS.trending.path}`, {
      params: { ...ENDPOINTS.trending.params },
      headers: yhHeaders(),
    });

    // Response shape: { finance: { result: [{ count, quotes: [{ symbol }] }] } }
    const results = response.data?.finance?.result ?? [];
    const rawQuotes = results[0]?.quotes ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const symbols = rawQuotes.slice(0, 10).map((q: any) => q.symbol);

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
