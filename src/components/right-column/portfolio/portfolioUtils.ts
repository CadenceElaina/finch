import { Portfolio, PortfolioSymbols } from "../../../types/types";

export const generatePortfolioSymbols = (
  portfolios: Portfolio[]
): PortfolioSymbols => {
  const portfolioSymbols: PortfolioSymbols = {};

  portfolios.forEach((portfolio) => {
    const symbolsWithQuantities =
      portfolio.securities?.reduce((acc, security) => {
        acc[security.symbol] = security.quantity;
        return acc;
      }, {} as { [symbol: string]: number }) || {};

    portfolioSymbols[portfolio.title] = symbolsWithQuantities;
  });

  return portfolioSymbols;
};

export const calculatePortfolioValues = (
  securities: {
    symbol: string;
    price: number;
    percentChange: number;
    quantity: number;
  }[]
) => {
  let totalPercentChange = 0;
  let portfolioValue = 0;

  securities.forEach((security) => {
    const { percentChange, quantity, price } = security;

    // Calculate the value change for each security
    const securityValueChange = quantity * price * (percentChange / 100);

    // Accumulate the total value and total percent change
    portfolioValue += quantity * price;
    totalPercentChange += securityValueChange;
  });

  // Calculate the overall portfolio percent change
  const overallPercentChange = (totalPercentChange / portfolioValue) * 100;

  return {
    totalPercentChange: overallPercentChange,
    portfolioValue,
  };
};
