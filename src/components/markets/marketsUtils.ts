import { quoteType } from "../search/types";
import { Exchange, IndexCard } from "./types";

export const formatApiResponse = (
  apiResponse: Record<string, quoteType | null>,
  exchange: Exchange
): IndexCard[] => {
  return Object.entries(apiResponse)
    .filter(([, quote]) => quote !== null && quote.price !== 0)
    .map(([symbol, quote]) => {
      const q = quote!;
      const percentChange = q.percentChange || 0;
      return {
        exchange,
        name: q.name || "",
        symbol,
        price: q.price || 0,
        priceChange: q.priceChange || 0,
        percentChange: parseFloat(percentChange.toFixed(2)),
      };
    });
};
