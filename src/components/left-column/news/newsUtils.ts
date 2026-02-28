import { QueryClient } from "@tanstack/react-query";
import axios from "axios";
import { YH_API_HOST, YH_API_KEY, ENDPOINTS } from "../../../config/api";
import { newsSegmentType } from "../../../types/types";
import { queryClient } from "../../quote-chart/quoteQueryClient";

const BASE = `https://${YH_API_HOST}/api`;
const headers = () => ({
  "X-RapidAPI-Key": YH_API_KEY,
  "X-RapidAPI-Host": YH_API_HOST,
});

const getRandomSegment = (): newsSegmentType => {
  const segments: newsSegmentType[] = ["Top", "Local", "World"];
  const randomIndex = Math.floor(Math.random() * segments.length);
  return segments[randomIndex];
};

const calculateTimeDifference = (pubDate: string): string => {
  const currentDate = new Date();
  const publishedDate = new Date(pubDate);
  const timeDifference = currentDate.getTime() - publishedDate.getTime();
  const hoursDifference = Math.floor(timeDifference / (1000 * 60 * 60));

  if (hoursDifference < 24) {
    return `${hoursDifference} hours ago`;
  } else {
    const days = Math.floor(hoursDifference / 24);
    const remainingHours = hoursDifference % 24;
    return `${days} day${days > 1 ? "s" : ""} ${remainingHours} hours ago`;
  }
};

export const getSymbolsNews = async (symbol: string) => {
  if (!symbol) {
    console.error("Symbol is undefined or empty");
    return [];
  }
  const cachedData = queryClient.getQueryData(["symbolNews"]);

  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await axios.get(
      `${BASE}${ENDPOINTS.news.path}`,
      {
        params: { tickers: symbol, type: "ALL" },
        headers: headers(),
      }
    );

    const rawArticles = Array.isArray(response.data) ? response.data : [];
    const articles = rawArticles.map(
      (a: {
        guid: string;
        link: string;
        title: string;
        pubDate: string;
        source: string;
      }) => ({
        id: a.guid ?? "",
        link: a.link ?? "",
        title: a.title ?? "",
        time: calculateTimeDifference(a.pubDate) ?? "time",
        img: "",
        source: a.source ?? "",
        relatedSymbol: symbol || "^DJI",
      })
    );

    // Cache the data
    queryClient.setQueryData(["symbolNews"], articles);

    return articles;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const getNews = async (queryClient: QueryClient) => {
  const cachedData = queryClient.getQueryData(["news"]);

  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await axios.get(
      `${BASE}${ENDPOINTS.news.path}`,
      {
        params: { type: "ALL" },
        headers: headers(),
      }
    );

    const rawArticles = Array.isArray(response.data) ? response.data : [];
    const articles = rawArticles.map(
      (a: {
        guid: string;
        link: string;
        title: string;
        pubDate: string;
        source: string;
      }) => ({
        id: a.guid ?? "",
        link: a.link ?? "",
        title: a.title ?? "",
        time: calculateTimeDifference(a.pubDate) ?? "time",
        img: "",
        source: a.source ?? "",
        relatedSymbol: "^DJI",
        segment: getRandomSegment(),
      })
    );

    // Cache the data
    queryClient.setQueryData(["news"], articles);

    return articles;
  } catch (error) {
    console.error(error);
    return [];
  }
};
