import { quoteType } from "../search/types";
import { Exchange, IndexCard } from "./types";

export const formatApiResponse = (
  apiResponse: Record<string, quoteType | null>,
  exchange: Exchange
): IndexCard[] => {
  return Object.entries(apiResponse).map(([symbol, quote]) => {
    if (quote === null) {
      // Handle null values as needed
      return {
        exchange,
        name: "",
        symbol,
        price: 0,
        priceChange: 0,
        percentChange: 0,
      };
    }

    const percentChange = (quote.percentChange || 0) * 100; // Convert to percentage
    return {
      exchange,
      name: quote.name || "",
      symbol,
      price: quote.price || 0,
      priceChange: quote.priceChange || 0,
      percentChange: parseFloat(percentChange.toFixed(2)),
    };
  });
};
