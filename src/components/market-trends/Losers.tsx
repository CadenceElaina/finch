import  { useEffect, useState } from "react";
import MarketTrendsButtons from "./MarketTrendsButtons";
import Layout from "../layout/Layout";
import Footer from "../Footer";
import { RowConfig } from "../table/types";
import Table from "../table/Table";
import SidebarNews from "./news/SidebarNews";
import "./MarketTrends.css";
import { useQueryClient } from "@tanstack/react-query";
import { getMoversSymbols, getQuote } from "../search/quoteUtils";
import { quoteType, utils } from "../search/types";
import { transformQuotesToData } from "./utils";

const Losers = () => {
  const [symbols, setSymbols] = useState<string[]>([]);
  const losersConfig: RowConfig = {
    fields: ["symbol", "name", "price", "priceChange", "percentChange"],
    addIcon: true,
  };
  const queryClient = useQueryClient();
  const [mostActiveQuotes, setMostActiveQuotes] = useState<
    Record<string, quoteType | null>
  >({});

  const fetchMostActiveQuotes = async () => {
    try {
      const newSymbols = await getMoversSymbols("losers");

      setSymbols(newSymbols);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchQuotesForSymbols = async () => {
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

    setMostActiveQuotes(symbolQuoteMap);
  };

  useEffect(() => {
    fetchMostActiveQuotes();
  }, [queryClient]);

  useEffect(() => {
    if (symbols.length > 0) {
      fetchQuotesForSymbols();
    }
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
              data={transformQuotesToData(mostActiveQuotes)}
              config={losersConfig}
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

export default Losers;
