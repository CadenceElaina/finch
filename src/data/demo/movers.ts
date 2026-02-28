/**
 * Demo market movers — Gainers, Losers, Most Active.
 * Matches the shape returned by getMoversSymbols() + transformQuotesToData().
 */

export interface DemoMoverData {
  id: number;
  symbol: string;
  name: string;
  price: number;
  priceChange: number;
  percentChange: number;
}

export const DEMO_GAINERS: DemoMoverData[] = [
  { id: 1, symbol: "NVDA", name: "NVIDIA Corporation", price: 131.28, priceChange: 5.64, percentChange: 4.49 },
  { id: 2, symbol: "AMD", name: "Advanced Micro Devices, Inc.", price: 113.72, priceChange: 4.35, percentChange: 3.98 },
  { id: 3, symbol: "SHOP", name: "Shopify Inc.", price: 118.25, priceChange: 3.40, percentChange: 2.96 },
  { id: 4, symbol: "UBER", name: "Uber Technologies, Inc.", price: 72.48, priceChange: 1.93, percentChange: 2.74 },
  { id: 5, symbol: "AMZN", name: "Amazon.com, Inc.", price: 216.20, priceChange: 4.10, percentChange: 1.93 },
];

export const DEMO_LOSERS: DemoMoverData[] = [
  { id: 1, symbol: "INTC", name: "Intel Corporation", price: 24.38, priceChange: -1.05, percentChange: -4.13 },
  { id: 2, symbol: "TSLA", name: "Tesla, Inc.", price: 338.59, priceChange: -8.41, percentChange: -2.42 },
  { id: 3, symbol: "BA", name: "The Boeing Company", price: 178.92, priceChange: -3.67, percentChange: -2.01 },
  { id: 4, symbol: "CRM", name: "Salesforce, Inc.", price: 308.40, priceChange: -5.12, percentChange: -1.63 },
  { id: 5, symbol: "WMT", name: "Walmart Inc.", price: 97.84, priceChange: -0.56, percentChange: -0.57 },
];

export const DEMO_MOST_ACTIVE: DemoMoverData[] = [
  { id: 1, symbol: "NVDA", name: "NVIDIA Corporation", price: 131.28, priceChange: 5.64, percentChange: 4.49 },
  { id: 2, symbol: "TSLA", name: "Tesla, Inc.", price: 338.59, priceChange: -8.41, percentChange: -2.42 },
  { id: 3, symbol: "AAPL", name: "Apple Inc.", price: 241.84, priceChange: 3.12, percentChange: 1.31 },
  { id: 4, symbol: "AMD", name: "Advanced Micro Devices, Inc.", price: 113.72, priceChange: 4.35, percentChange: 3.98 },
  { id: 5, symbol: "AMZN", name: "Amazon.com, Inc.", price: 216.20, priceChange: 4.10, percentChange: 1.93 },
];
