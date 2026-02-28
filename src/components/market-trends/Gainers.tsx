import  { useEffect, useState } from "react";
import MarketTrendsButtons from "./MarketTrendsButtons";
import Layout from "../layout/Layout";
import Footer from "../Footer";
import { RowConfig } from "../table/types";
import Table from "../table/Table";
import SidebarNews from "./news/SidebarNews";
import "./MarketTrends.css";
import { useQueryClient } from "@tanstack/react-query";
import { getMoversSymbols, getBatchQuotes } from "../search/quoteUtils";
import { quoteType } from "../search/types";
import { transformQuotesToData } from "./utils";

const Gainers = () => {
  const [symbols, setSymbols] = useState<string[]>([]);
  const gainersConfig: RowConfig = {
    fields: ["symbol", "name", "price", "priceChange", "percentChange"],
    addIcon: true,
  };
  const queryClient = useQueryClient();
  const [mostActiveQuotes, setMostActiveQuotes] = useState<
    Record<string, quoteType | null>
  >({});

  const fetchMostActiveQuotes = async () => {
    try {
      const newSymbols = await getMoversSymbols("gainers", queryClient);

      setSymbols(newSymbols);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchQuotesForSymbols = async () => {
    const symbolQuoteMap = await getBatchQuotes(queryClient, symbols);
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
              config={gainersConfig}
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

export default Gainers;
