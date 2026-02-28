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
import { getBatchQuotes } from "../search/quoteUtils";
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
    const symbolQuoteMap = await getBatchQuotes(queryClient, symbols);
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
