import { QueryClient } from "@tanstack/react-query";
import axios from "axios";
import { YH_KEY, /*  YH_KEY1, YH_KEY3, */ YH_URL } from "../../../constants";
import { newsSegmentType } from "../../../types/types";
import { queryClient } from "../../quote-chart/quoteQueryClient";

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

  const options = {
    method: "POST",
    url: "https://apidojo-yahoo-finance-v1.p.rapidapi.com/news/v2/list",
    params: {
      region: "US",
      snippetCount: "28",
      s: `${symbol}`,
    },
    headers: {
      "content-type": "text/plain",
      "X-RapidAPI-Key": `${YH_KEY}`,
      "X-RapidAPI-Host": `${YH_URL}`,
    },
    data: "Pass in the value of uuids field returned right in this endpoint to load the next page, or leave empty to load first page",
  };

  try {
    const response = await axios.request(options);
    const articles = response.data.data.main.stream.map(
      (a: {
        content: {
          id: string;
          clickThroughUrl: { url: string };
          title: string;
          pubDate: string;
          thumbnail: { resolutions: { url: string }[] };
          provider: { displayName: string };
          finance: { stockTickers: { symbol: string }[] };
        };
      }) => ({
        id: a.content.id ?? "",
        link: a.content?.clickThroughUrl?.url || "",
        title: a.content.title ?? "",
        time: calculateTimeDifference(a.content.pubDate) ?? "time",
        img:
          a.content.thumbnail?.resolutions?.[3]?.url ||
          a.content.thumbnail?.resolutions?.[2]?.url ||
          a.content.thumbnail?.resolutions?.[1]?.url ||
          a.content.thumbnail?.resolutions?.[0]?.url ||
          "",
        source: a.content.provider.displayName ?? "",
        relatedSymbol: a.content.finance?.stockTickers?.[0]?.symbol || "^DJI",
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

  const options = {
    method: "POST",
    url: "https://apidojo-yahoo-finance-v1.p.rapidapi.com/news/v2/list",
    params: {
      region: "US",
      snippetCount: "28",
    },
    headers: {
      "content-type": "text/plain",
      "X-RapidAPI-Key": `${YH_KEY}`,
      "X-RapidAPI-Host": `${YH_URL}`,
    },
    data: "Pass in the value of uuids field returned right in this endpoint to load the next page, or leave empty to load first page",
  };

  try {
    const response = await axios.request(options);
    const articles = response.data.data.main.stream.map(
      (a: {
        content: {
          id: string;
          clickThroughUrl: { url: string };
          title: string;
          pubDate: string;
          thumbnail: { resolutions: { url: string }[] };
          provider: { displayName: string };
          finance: { stockTickers: { symbol: string }[] };
        };
      }) => ({
        id: a.content.id ?? "",
        link: a.content?.clickThroughUrl?.url || "",
        title: a.content.title ?? "",
        time: calculateTimeDifference(a.content.pubDate) ?? "time",
        img:
          a.content.thumbnail?.resolutions?.[3]?.url ||
          a.content.thumbnail?.resolutions?.[2]?.url ||
          a.content.thumbnail?.resolutions?.[1]?.url ||
          a.content.thumbnail?.resolutions?.[0]?.url ||
          "",
        source: a.content.provider.displayName ?? "",
        relatedSymbol: a.content.finance?.stockTickers?.[0]?.symbol || "^DJI",
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
