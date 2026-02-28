import { Portfolio, Security } from "../../types/types";
import { quoteType } from "../search/types";

export type Data = {
  id: number;
  symbol: string;
  name: string;
  price: number;
  priceChange: number;
  percentChange: number;
  quantity?: number;
};

export const transformQuotesToData = (
  quotes: Record<string, quoteType | null>
): Data[] => {
  return Object.entries(quotes).map(([symbol, quote], i) => {
    const percentChange = (quote?.percentChange || 0) * 100; // Convert to percentage
    return {
      id: i + 1,
      symbol,
      name: quote?.name || "",
      price: quote?.price || 0,
      priceChange: quote?.priceChange || 0,
      percentChange: parseFloat(percentChange.toFixed(2)),
    };
  });
};

export const transformQuotesToDataWithQuantities = (
  quotes: Record<string, quoteType | null>,
  portfolio: Portfolio
): Data[] => {
  return Object.entries(quotes).map(([symbol, quote], i) => {
    const percentChange = (quote?.percentChange || 0) * 100; // Convert to percentage
    let security: Security | undefined;
    if (portfolio && portfolio.securities) {
      security = portfolio?.securities.find(
        (s: Security) => s.symbol === symbol
      );
    }
    const quantity = security?.quantity || 0;

    return {
      id: i + 1,
      symbol,
      name: quote?.name || "",
      price: quote?.price || 0,
      priceChange: quote?.priceChange || 0,
      percentChange: parseFloat(percentChange.toFixed(2)),
      quantity,
    };
  });
};
