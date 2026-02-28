import  { useEffect, useState } from "react";
import Layout from "../layout/Layout";
import Footer from "../Footer";
import Table from "../table/Table";
import MarketTrendsButtons from "./MarketTrendsButtons";
import SidebarNews from "./news/SidebarNews";
import { RowConfig } from "../table/types";
import { getTrending } from "../search/quoteUtils";
import { useQueryClient } from "@tanstack/react-query";
import "./MarketTrends.css";

const Trending = () => {
  const exploreConfig: RowConfig = {
    fields: ["id", "symbol", "name", "price", "priceChange", "percentChange"],
    addIcon: true,
  };

  const [trendingData, setTrendingData] = useState([]);
  const queryClient = useQueryClient();
  useEffect(() => {
    const fetchTrendingData = async () => {
      try {
        const data = await getTrending(queryClient);
        setTrendingData(data);
      } catch (error) {
        console.error("Error fetching trending data:", error);
      }
    };

    fetchTrendingData();
  }, []);

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
              data={trendingData}
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

export default Trending;
