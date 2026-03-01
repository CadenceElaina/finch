import { QueryClient } from "@tanstack/react-query";
import {
  SA_ENDPOINTS,
  saFetch,
} from "../../../config/seekingAlphaApi";
import { Article, NewsSegmentType } from "../../../types/types";
import { isDemoActive } from "../../../data/demo/demoState";
import { DEMO_NEWS, DEMO_SYMBOL_NEWS } from "../../../data/demo";

/**
 * Calculate a human-readable time difference string.
 */
const calculateTimeDifference = (pubDate: string): string => {
  const currentDate = new Date();
  const publishedDate = new Date(pubDate);
  const timeDifference = currentDate.getTime() - publishedDate.getTime();
  const minutesDifference = Math.floor(timeDifference / (1000 * 60));

  if (minutesDifference < 60) {
    return `${minutesDifference}m ago`;
  }
  const hoursDifference = Math.floor(minutesDifference / 60);
  if (hoursDifference < 24) {
    return `${hoursDifference}h ago`;
  }
  const days = Math.floor(hoursDifference / 24);
  const remainingHours = hoursDifference % 24;
  return `${days}d ${remainingHours}h ago`;
};

/**
 * Map Seeking Alpha theme slugs to our NewsSegmentType.
 *
 * SA returns themes as an object keyed by slug:
 *   { "us-economy": { slug, title, non_theme }, "consumer": { ... } }
 * We extract the slugs, filter out non_theme entries, and bucket into our segments.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapSegment = (themes: any): NewsSegmentType[] => {
  const segments: NewsSegmentType[] = ["Top"]; // every article shows in Top

  if (!themes || typeof themes !== "object") return segments;

  // SA themes is an object: keys are slugs, values have { slug, title, non_theme }
  const slugs: string[] = Object.entries(themes)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter(([, v]: [string, any]) => !v?.non_theme)
    .map(([key]) => key.toLowerCase());

  if (slugs.some((s) => /world|global|international|geopolitic|emerging/.test(s))) {
    segments.push("World");
  }
  if (slugs.some((s) => /\bus|domestic|local|economy/.test(s))) {
    segments.push("Local");
  }
  return segments;
};

/**
 * Build a lookup map from SA tag IDs to ticker symbols.
 * The `included` array in SA responses contains objects like:
 *   { id: "609845", type: "tag", attributes: { name: "VCSA", tagKind: "Tags::Ticker" } }
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const buildTickerMap = (included: any[]): Record<string, string> => {
  const map: Record<string, string> = {};
  if (!Array.isArray(included)) return map;
  for (const item of included) {
    if (item.type === "tag" && item.attributes?.tagKind === "Tags::Ticker") {
      map[String(item.id)] = (item.attributes.name ?? item.attributes.slug ?? "").toUpperCase();
    }
  }
  return map;
};

/**
 * Transform a Seeking Alpha news API item into our Article shape.
 * @param tickerMap — optional map from tag ID → ticker symbol (from `included` array)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformSaArticle = (item: any, tickerMap?: Record<string, string>): Article => {
  const attrs = item.attributes ?? item;
  const links = item.links ?? attrs.links ?? {};

  // Resolve primary ticker from relationships + included map
  let relatedSymbol = "";
  if (tickerMap) {
    const primaryTickers = item.relationships?.primaryTickers?.data;
    if (Array.isArray(primaryTickers) && primaryTickers.length > 0) {
      relatedSymbol = tickerMap[String(primaryTickers[0].id)] ?? "";
    }
  }

  return {
    id: String(item.id ?? ""),
    title: attrs.title ?? "",
    link: attrs.getUrl ?? attrs.uri ?? (links.canonical ?? (links.self ? `https://seekingalpha.com${links.self}` : "#")),
    source: "Seeking Alpha",
    time: attrs.publishOn ? calculateTimeDifference(attrs.publishOn) : "",
    relatedSymbol,
    img: attrs.gettyImageUrl ?? attrs.imageUrl ?? "",
    segment: mapSegment(attrs.themes),
  };
};

/**
 * Fetch general market news from Seeking Alpha.
 * Cached in react-query AND localStorage for 10 minutes.
 */
export const getNews = async (queryClient: QueryClient): Promise<Article[]> => {
  // 1. Check react-query in-memory cache
  const cached = queryClient.getQueryData<Article[]>(["saNews"]);
  if (cached && cached.length > 0) return cached;

  // Demo mode fallback
  if (isDemoActive()) return DEMO_NEWS;

  // 2. Check localStorage (survives page reloads / dev server restarts)
  try {
    const lsRaw = localStorage.getItem("finch_sa_news");
    if (lsRaw) {
      const { data: lsData, ts } = JSON.parse(lsRaw) as { data: Article[]; ts: number };
      const TEN_MINUTES = 10 * 60 * 1000;
      if (Date.now() - ts < TEN_MINUTES && lsData.length > 0) {
        queryClient.setQueryData(["saNews"], lsData);
        return lsData;
      }
    }
  } catch {
    // localStorage read failed — continue to fetch
  }

  try {
    const response = await saFetch(SA_ENDPOINTS.newsList, {
      category: "market-news::all",
      size: 20,
      number: 1,
    });

    const items = response.data?.data ?? [];
    const included = response.data?.included ?? [];
    const tickerMap = buildTickerMap(included);
    const articles: Article[] = items.map((item: unknown) => transformSaArticle(item, tickerMap));

    queryClient.setQueryData(["saNews"], articles);
    // Persist to localStorage
    try {
      localStorage.setItem("finch_sa_news", JSON.stringify({ data: articles, ts: Date.now() }));
    } catch { /* quota exceeded — ignore */ }
    return articles;
  } catch (error) {
    console.error("Failed to fetch SA news:", error);
    return [];
  }
};

/**
 * Fetch news for a specific symbol from Seeking Alpha.
 */
export const getSymbolsNews = async (symbol: string): Promise<Article[]> => {
  if (!symbol) return [];

  // Demo mode fallback
  if (isDemoActive()) {
    const sym = symbol.toUpperCase();
    return DEMO_SYMBOL_NEWS[sym] ?? [];
  }

  try {
    const response = await saFetch(
      SA_ENDPOINTS.newsBySymbol,
      { id: symbol.toLowerCase(), size: 10, number: 1 },
    );

    const items = response.data?.data ?? [];
    const included = response.data?.included ?? [];
    const tickerMap = buildTickerMap(included);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const articles: Article[] = items.map((item: any) => {
      const a = transformSaArticle(item, tickerMap);
      // For symbol-specific news, override related symbol if not resolved from included
      if (!a.relatedSymbol) a.relatedSymbol = symbol.toUpperCase();
      return a;
    });

    return articles;
  } catch (error) {
    console.error(`Failed to fetch SA news for ${symbol}:`, error);
    return [];
  }
};
