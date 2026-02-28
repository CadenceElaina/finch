import { QueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  QuotePageData,
  QuotePageFinancialData,
  QuotePageSidebarAboutData,
  QuotePageSidebarData,
  previousClose,
  quoteType,
  utils,
} from "./types";

// YH Finance is the primary API for quotes
import { YH_API_HOST, YH_API_KEY, ENDPOINTS } from "../../config/api";
const YH_BASE = `https://${YH_API_HOST}`;
const yhHeaders = () => ({
  "X-RapidAPI-Key": YH_API_KEY,
  "X-RapidAPI-Host": YH_API_HOST,
});

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

  // 1. Drain cache first
  for (const sym of symbols) {
    const cached = queryClient.getQueryData(["quote", sym]);
    if (cached) {
      result[sym] = utils.checkCachedQuoteType(cached);
    } else {
      uncached.push(sym);
    }
  }

  if (uncached.length === 0) return result;

  // 2. Batch fetch all uncached symbols in one YH Finance call
  try {
    const symbolsParam = uncached.join(",");
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

    for (const sym of uncached) {
      const raw = bySymbol[sym] ?? bySymbol[sym.toUpperCase()];
      if (raw) {
        const parsed = parseQuote(raw, sym);
        result[sym] = parsed;
        queryClient.setQueryData(["quote", sym], parsed);
      } else {
        result[sym] = null;
      }
    }
  } catch (error) {
    console.error("getBatchQuotes YH error:", error);
    for (const sym of uncached) {
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

export const getPreviousClose = async (
  queryClient: QueryClient,
  symbol: string
): Promise<previousClose | null> => {
  try {
    const cachedQuote = queryClient.getQueryData(["prevClose", symbol]);
    if (cachedQuote) {
      const newCachedQuote = utils.checkCachedQuoteType(cachedQuote);
      return newCachedQuote;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
    const response = await axios.get(
      `${YH_BASE}${ENDPOINTS.batchQuotes.path}`,
      { params: { region: "US", symbols: symbol }, headers: yhHeaders() }
    );

    const q = response.data?.quoteResponse?.result?.[0];
    if (!q) throw new Error("No quote data returned");

    const quoteData: previousClose = {
      symbol: q.symbol?.toLowerCase() ?? symbol.toLowerCase(),
      previousClose: q.regularMarketPreviousClose ?? 0,
      name: q.shortName ?? "",
    };

    queryClient.setQueryData(["prevClose", symbol], quoteData);
    return quoteData;
  } catch (error) {
    return null;
  }
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

    await new Promise((resolve) => setTimeout(resolve, 500));
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

    await new Promise((resolve) => setTimeout(resolve, 500));

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
          quoteSidebarAboutData = {
            summary: profile.longBusinessSummary ?? "",
            website: profile.website ?? "",
            headquarters: `${profile.city || ""}, ${getStateFullName(profile.state ?? "") || ""} ${profile.country || ""}`.trim(),
            employees: profile.fullTimeEmployees
              ? `${profile.fullTimeEmployees}`
              : "",
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

export const getMoversSymbols = async (title: string): Promise<string[]> => {
  // Map UI title strings to API type param
  let type = "MOST_ACTIVE";
  if (title === "active") type = "MOST_ACTIVE";
  else if (title === "losers") type = "LOSERS";
  else type = "GAINERS";

  try {
    const response = await axios.get(`${YH_BASE}${ENDPOINTS.trending.path}`, {
      params: { type },
      headers: yhHeaders(),
    });

    // Response may be { body: [...] } or a flat array
    const quotes = response.data?.body ?? response.data ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const symbols: string[] = quotes.slice(0, 5).map((q: any) => q.symbol);
    return symbols;
  } catch (error) {
    return [];
  }
};

export const getTrending = async (queryClient: QueryClient) => {
  const cachedData = queryClient.getQueryData(["trending"]);
  if (cachedData) return cachedData;

  try {
    const response = await axios.get(`${YH_BASE}${ENDPOINTS.trending.path}`, {
      params: { type: "MOST_WATCHED" },
      headers: yhHeaders(),
    });

    const quotes = response.data?.body ?? response.data ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trendingQuotes = quotes.slice(0, 10).map((q: any) => ({
      symbol: q.symbol,
      name: q.shortName ?? q.longName ?? "",
      price: q.regularMarketPrice ?? 0,
      priceChange: (q.regularMarketChange ?? 0).toFixed(2),
      percentChange: (q.regularMarketChangePercent ?? 0).toFixed(2),
    }));

    queryClient.setQueryData(["trending"], trendingQuotes);
    return trendingQuotes;
  } catch (error) {
    return [];
  }
};
