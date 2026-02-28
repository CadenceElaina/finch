import { useEffect, useState } from "react";
import MarketTrendsButtons from "./MarketTrendsButtons";
import Layout from "../layout/Layout";
import Footer from "../Footer";
import Table from "../table/Table";
import { RowConfig } from "../table/types";
import SidebarNews from "./news/SidebarNews";
import "./MarketTrends.css";
import { useQueryClient } from "@tanstack/react-query";

import { quoteType } from "../search/types";
import { transformQuotesToData } from "./utils";
import { utils } from "../search/types";
import { getQuote } from "../search/quoteUtils";
//
const symbols = ["^GSPC", "^DJI", "^IXIC", "^RUT", "^VIX"];

const MarketIndexes = () => {
  const exploreConfig: RowConfig = {
    fields: ["id", "symbol", "name", "price", "priceChange", "percentChange"],
    addIcon: true,
  };

  const queryClient = useQueryClient();
  const [symbolQuotes, setSymbolQuotes] = useState<
    Record<string, quoteType | null>
  >({});

  const fetchSymbolQuotes = async () => {
    const quotePromises = symbols.map(async (symbol) => {
      // Check the cache first
      const cachedQuote = queryClient.getQueryData(["quote", symbol]);

      if (cachedQuote) {
        const newCachedQuote = utils.checkCachedQuoteType(cachedQuote);
        return newCachedQuote;
      }

      // If not in the cache, make an API call
      const quoteData = await getQuote(queryClient, symbol);
      await new Promise((resolve) => setTimeout(resolve, 200)); // 200ms delay
      // Update the cache
      queryClient.setQueryData(["quote", symbol], quoteData);

      return quoteData;
    });

    const quotes = await Promise.all(quotePromises);

    const symbolQuoteMap: Record<string, quoteType | null> = {};
    symbols.forEach((symbol, index) => {
      symbolQuoteMap[symbol] = quotes[index];
    });

    setSymbolQuotes(symbolQuoteMap);
  };

  useEffect(() => {
    fetchSymbolQuotes();
  }, [symbols, queryClient]);

  return (
    <Layout>
      <div className="trends-container">
        <div role="heading" className="explore-heading">
          Explore market trends
        </div>
        <div className="trend-buttons">
          <MarketTrendsButtons />
        </div>
        <div className="explore-main-content trending-table">
          <div className="explore-table">
            <Table
              data={transformQuotesToData(symbolQuotes)}
              config={exploreConfig}
              full={true}
              icon={true}
            />
          </div>
          <div className="explore-news">
            <SidebarNews />
          </div>
        </div>
      </div>
      <Footer />
    </Layout>
  );
};

export default MarketIndexes;
