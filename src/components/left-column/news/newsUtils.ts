import { QueryClient } from "@tanstack/react-query";
import {
  SA_ENDPOINTS,
  saFetch,
} from "../../../config/seekingAlphaApi";
import { Article, NewsSegmentType } from "../../../types/types";

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
 * Map a Seeking Alpha news category string to our NewsSegmentType.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapSegment = (themes: any): NewsSegmentType[] => {
  // SA articles can have themes like "Financial", "Market News", "World", etc.
  // We bucket them into our three segments.
  if (!themes || !Array.isArray(themes)) return ["Top"];

  const segments: NewsSegmentType[] = ["Top"]; // every article shows in Top
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const themeNames = themes.map((t: any) =>
    (typeof t === "string" ? t : t?.name ?? "").toLowerCase()
  );

  if (themeNames.some((n: string) => n.includes("world") || n.includes("global") || n.includes("international"))) {
    segments.push("World");
  }
  if (themeNames.some((n: string) => n.includes("us") || n.includes("domestic") || n.includes("local"))) {
    segments.push("Local");
  }
  return segments;
};

/**
 * Transform a Seeking Alpha news API item into our Article shape.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformSaArticle = (item: any): Article => {
  const attrs = item.attributes ?? item;
  return {
    id: String(item.id ?? ""),
    title: attrs.title ?? "",
    link: attrs.getUrl ?? attrs.uri ?? (attrs.links?.self ? `https://seekingalpha.com${attrs.links.self}` : "#"),
    source: "Seeking Alpha",
    time: attrs.publishOn ? calculateTimeDifference(attrs.publishOn) : "",
    relatedSymbol: "",  // SA general news doesn't always have a symbol
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
    const articles: Article[] = items.map(transformSaArticle);

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

  try {
    const response = await saFetch(
      SA_ENDPOINTS.newsBySymbol,
      { id: symbol.toLowerCase(), size: 10, number: 1 },
    );

    const items = response.data?.data ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const articles: Article[] = items.map((item: any) => {
      const a = transformSaArticle(item);
      a.relatedSymbol = symbol.toUpperCase();
      return a;
    });

    return articles;
  } catch (error) {
    console.error(`Failed to fetch SA news for ${symbol}:`, error);
    return [];
  }
};
