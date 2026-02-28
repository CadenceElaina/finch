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
import { YH_API_HOST, YH_API_KEY, ENDPOINTS } from "../../config/api";

const BASE = `https://${YH_API_HOST}/api`;

const headers = () => ({
  "X-RapidAPI-Key": YH_API_KEY,
  "X-RapidAPI-Host": YH_API_HOST,
});

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
      `${BASE}${ENDPOINTS.singleQuote.path}`,
      { params: { ticker: symbol, type: "STOCKS" }, headers: headers() }
    );

    const q = response.data?.[0];
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
      `${BASE}${ENDPOINTS.singleQuote.path}`,
      { params: { ticker: symbol, type: "STOCKS" }, headers: headers() }
    );

    const q = response.data?.[0];
    if (!q) throw new Error("No quote data returned");

    const quoteData: quoteType = {
      symbol: q.symbol?.toLowerCase() ?? symbol.toLowerCase(),
      price: q.regularMarketPrice ?? 0,
      name: q.shortName ?? "",
      priceChange: (q.regularMarketChange ?? 0).toFixed(2),
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

    // Fetch basic quote data
    const response = await axios.get(
      `${BASE}${ENDPOINTS.singleQuote.path}`,
      { params: { ticker: symbol, type: "STOCKS" }, headers: headers() }
    );

    const q = response.data?.[0];
    if (!q) throw new Error("No quote data returned");

    const quoteData: quoteType = {
      symbol: q.symbol?.toLowerCase() ?? symbol.toLowerCase(),
      price: q.regularMarketPrice ?? 0,
      name: q.shortName ?? "",
      priceChange: (q.regularMarketChange ?? 0).toFixed(2),
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

    // Module data (profile, financials) requires separate calls
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
        const [profileRes, financialRes] = await Promise.all([
          axios.get(`${BASE}${ENDPOINTS.modules.path}`, {
            params: { ticker: symbol, module: "asset-profile" },
            headers: headers(),
          }),
          axios.get(`${BASE}${ENDPOINTS.modules.path}`, {
            params: { ticker: symbol, module: "financial-data" },
            headers: headers(),
          }),
        ]);

        const profile = profileRes.data?.body?.assetProfile ?? profileRes.data?.assetProfile;
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

        const fin = financialRes.data?.body?.financialData ?? financialRes.data?.financialData;
        if (fin) {
          quoteFinancialData = {
            annualRevenue: fin.totalRevenue?.fmt ?? "",
            netIncome: fin.netIncomeToCommon?.fmt ?? "",
            netProfitMargin: fin.profitMargins?.fmt ?? "",
            ebitda: fin.ebitda?.fmt ?? "",
          };
        }
      } catch {
        // Module calls failed — keep empty defaults
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
    const response = await axios.get(`${BASE}${ENDPOINTS.trending.path}`, {
      params: { type },
      headers: headers(),
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
    const response = await axios.get(`${BASE}${ENDPOINTS.trending.path}`, {
      params: { type: "MOST_WATCHED" },
      headers: headers(),
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
