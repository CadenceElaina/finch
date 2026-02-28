/**
 * Demo trending tickers.
 * Matches the shape returned by getTrending() — note priceChange/percentChange
 * are strings (the real function uses .toFixed(2)).
 */

export interface DemoTrendingData {
  id: number;
  symbol: string;
  name: string;
  price: number;
  priceChange: string;
  percentChange: string;
}

export const DEMO_TRENDING: DemoTrendingData[] = [
  { id: 1, symbol: "NVDA", name: "NVIDIA Corporation", price: 131.28, priceChange: "5.64", percentChange: "4.49" },
  { id: 2, symbol: "TSLA", name: "Tesla, Inc.", price: 338.59, priceChange: "-8.41", percentChange: "-2.42" },
  { id: 3, symbol: "AAPL", name: "Apple Inc.", price: 241.84, priceChange: "3.12", percentChange: "1.31" },
  { id: 4, symbol: "AMZN", name: "Amazon.com, Inc.", price: 216.20, priceChange: "4.10", percentChange: "1.93" },
  { id: 5, symbol: "GOOGL", name: "Alphabet Inc.", price: 185.43, priceChange: "1.87", percentChange: "1.02" },
  { id: 6, symbol: "META", name: "Meta Platforms, Inc.", price: 676.10, priceChange: "2.35", percentChange: "0.35" },
  { id: 7, symbol: "AMD", name: "Advanced Micro Devices, Inc.", price: 113.72, priceChange: "4.35", percentChange: "3.98" },
  { id: 8, symbol: "MSFT", name: "Microsoft Corporation", price: 415.60, priceChange: "-2.45", percentChange: "-0.59" },
  { id: 9, symbol: "NFLX", name: "Netflix, Inc.", price: 1028.35, priceChange: "12.80", percentChange: "1.26" },
  { id: 10, symbol: "JPM", name: "JPMorgan Chase & Co.", price: 268.44, priceChange: "1.20", percentChange: "0.45" },
];
