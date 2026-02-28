/**
 * Demo quote page data — full profile/sidebar info for popular stocks.
 * Matches the QuotePageData shape from search/types.ts.
 */

import { QuotePageData } from "../../components/search/types";

export const DEMO_QUOTE_PAGE_DATA: Record<string, QuotePageData> = {
  AAPL: {
    quoteData: {
      symbol: "aapl",
      name: "Apple Inc.",
      price: 241.84,
      priceChange: 3.12,
      percentChange: 1.31,
    },
    quoteSidebarData: {
      previousClose: "$238.72",
      dayRange: "$239.10 - $242.50",
      fiftyTwoWeekHigh: "260.10",
      marketCap: "3.68T",
      average3MonthVolume: "48.32M",
      trailingPE: "38.45",
      dividendYield: "0.44%",
      primaryExchange: "NASDAQ",
    },
    quoteSidebarAboutData: {
      summary:
        "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. The company offers iPhone, Mac, iPad, and wearables, home and accessories including AirPods, Apple TV, Apple Watch, Beats products, and HomePod.",
      website: "https://www.apple.com",
      headquarters: "Cupertino, California United States",
      employees: "164000",
      ceo: "Tim Cook",
    },
    quoteFinancialData: {
      annualRevenue: "391.04B",
      netIncome: "93.74B",
      netProfitMargin: "23.97%",
      ebitda: "134.66B",
    },
  },
  MSFT: {
    quoteData: {
      symbol: "msft",
      name: "Microsoft Corporation",
      price: 415.60,
      priceChange: -2.45,
      percentChange: -0.59,
    },
    quoteSidebarData: {
      previousClose: "$418.05",
      dayRange: "$414.20 - $419.80",
      fiftyTwoWeekHigh: "468.35",
      marketCap: "3.09T",
      average3MonthVolume: "20.15M",
      trailingPE: "35.80",
      dividendYield: "0.72%",
      primaryExchange: "NASDAQ",
    },
    quoteSidebarAboutData: {
      summary:
        "Microsoft Corporation develops and supports software, services, devices, and solutions worldwide. The company operates through Productivity and Business Processes, Intelligent Cloud, and More Personal Computing segments.",
      website: "https://www.microsoft.com",
      headquarters: "Redmond, Washington United States",
      employees: "228000",
      ceo: "Satya Nadella",
    },
    quoteFinancialData: {
      annualRevenue: "245.12B",
      netIncome: "88.14B",
      netProfitMargin: "35.96%",
      ebitda: "125.43B",
    },
  },
  GOOGL: {
    quoteData: {
      symbol: "googl",
      name: "Alphabet Inc.",
      price: 185.43,
      priceChange: 1.87,
      percentChange: 1.02,
    },
    quoteSidebarData: {
      previousClose: "$183.56",
      dayRange: "$183.90 - $186.20",
      fiftyTwoWeekHigh: "207.05",
      marketCap: "2.28T",
      average3MonthVolume: "25.60M",
      trailingPE: "24.10",
      dividendYield: "0.46%",
      primaryExchange: "NASDAQ",
    },
    quoteSidebarAboutData: {
      summary:
        "Alphabet Inc. offers various products and platforms in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America. It operates through Google Services, Google Cloud, and Other Bets segments.",
      website: "https://abc.xyz",
      headquarters: "Mountain View, California United States",
      employees: "182502",
      ceo: "Sundar Pichai",
    },
    quoteFinancialData: {
      annualRevenue: "350.02B",
      netIncome: "100.68B",
      netProfitMargin: "28.76%",
      ebitda: "118.92B",
    },
  },
  NVDA: {
    quoteData: {
      symbol: "nvda",
      name: "NVIDIA Corporation",
      price: 131.28,
      priceChange: 5.64,
      percentChange: 4.49,
    },
    quoteSidebarData: {
      previousClose: "$125.64",
      dayRange: "$126.40 - $132.10",
      fiftyTwoWeekHigh: "153.13",
      marketCap: "3.22T",
      average3MonthVolume: "248.50M",
      trailingPE: "54.20",
      dividendYield: "0.03%",
      primaryExchange: "NASDAQ",
    },
    quoteSidebarAboutData: {
      summary:
        "NVIDIA Corporation provides graphics and compute and networking solutions in the United States, Taiwan, China, Hong Kong, and internationally. The company operates through two segments, Graphics and Compute & Networking.",
      website: "https://www.nvidia.com",
      headquarters: "Santa Clara, California United States",
      employees: "32600",
      ceo: "Jensen Huang",
    },
    quoteFinancialData: {
      annualRevenue: "130.50B",
      netIncome: "72.88B",
      netProfitMargin: "55.84%",
      ebitda: "81.22B",
    },
  },
  TSLA: {
    quoteData: {
      symbol: "tsla",
      name: "Tesla, Inc.",
      price: 338.59,
      priceChange: -8.41,
      percentChange: -2.42,
    },
    quoteSidebarData: {
      previousClose: "$347.00",
      dayRange: "$336.20 - $349.80",
      fiftyTwoWeekHigh: "488.54",
      marketCap: "1.09T",
      average3MonthVolume: "95.40M",
      trailingPE: "162.50",
      dividendYield: "",
      primaryExchange: "NASDAQ",
    },
    quoteSidebarAboutData: {
      summary:
        "Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems. The company operates through Automotive, and Energy Generation and Storage segments.",
      website: "https://www.tesla.com",
      headquarters: "Austin, Texas United States",
      employees: "140473",
      ceo: "Elon Musk",
    },
    quoteFinancialData: {
      annualRevenue: "97.69B",
      netIncome: "7.09B",
      netProfitMargin: "7.26%",
      ebitda: "13.29B",
    },
  },
  AMZN: {
    quoteData: {
      symbol: "amzn",
      name: "Amazon.com, Inc.",
      price: 216.20,
      priceChange: 4.10,
      percentChange: 1.93,
    },
    quoteSidebarData: {
      previousClose: "$212.10",
      dayRange: "$213.40 - $217.80",
      fiftyTwoWeekHigh: "242.52",
      marketCap: "2.27T",
      average3MonthVolume: "42.80M",
      trailingPE: "42.15",
      dividendYield: "",
      primaryExchange: "NASDAQ",
    },
    quoteSidebarAboutData: {
      summary:
        "Amazon.com, Inc. engages in the retail sale of consumer products, advertising, and subscription services through online and physical stores in North America and internationally.",
      website: "https://www.amazon.com",
      headquarters: "Seattle, Washington United States",
      employees: "1551000",
      ceo: "Andy Jassy",
    },
    quoteFinancialData: {
      annualRevenue: "637.97B",
      netIncome: "59.25B",
      netProfitMargin: "9.29%",
      ebitda: "115.35B",
    },
  },
  META: {
    quoteData: {
      symbol: "meta",
      name: "Meta Platforms, Inc.",
      price: 676.10,
      priceChange: 2.35,
      percentChange: 0.35,
    },
    quoteSidebarData: {
      previousClose: "$673.75",
      dayRange: "$672.40 - $679.30",
      fiftyTwoWeekHigh: "740.91",
      marketCap: "1.72T",
      average3MonthVolume: "14.20M",
      trailingPE: "27.80",
      dividendYield: "0.34%",
      primaryExchange: "NASDAQ",
    },
    quoteSidebarAboutData: {
      summary:
        "Meta Platforms, Inc. engages in the development of products that enable people to connect and share with friends and family through mobile devices, personal computers, virtual reality headsets, and wearables worldwide.",
      website: "https://investor.fb.com",
      headquarters: "Menlo Park, California United States",
      employees: "72404",
      ceo: "Mark Zuckerberg",
    },
    quoteFinancialData: {
      annualRevenue: "164.71B",
      netIncome: "62.36B",
      netProfitMargin: "37.86%",
      ebitda: "76.48B",
    },
  },
};
