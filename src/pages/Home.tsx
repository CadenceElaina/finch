import * as React from "react";

import Layout from "../components/layout/Layout";
import Markets from "../components/markets/Markets";
import Search from "../components/search/Search";
import Watchlist from "../components/left-column/Watchlist";
import AddPortfolio from "../components/right-column/portfolio/AddPortfolio";
import MarketTrends from "../components/right-column/MarketTrends";
import MostFollowed from "../components/right-column/MostFollowed";
import MarketTrendsList from "../components/MarketTrendsList";
import DiscoverMore from "../components/slider/DiscoverMore";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { usePortfolios } from "../context/PortfoliosContext";
import YourPortfolios from "../components/right-column/portfolio/YourPortfolios";
import HomeNews from "../components/left-column/news/HomeNews";
import Notification from "../components/Notification";

interface HomeProps {
  portfolios: [];
}

const Home: React.FC<HomeProps> = () => {
  const { user } = useAuth();
  const { portfolios } = usePortfolios();
  return (
    <>
      <Layout>
        <Notification />
        <div className="content-wrapper">
          <Markets />
          <Search />
          <div className="main-content-container">
            <div className="main-content-left">
              <Watchlist />
              <HomeNews />
            </div>
            <div className="main-content-right">
              {portfolios && user ? <YourPortfolios /> : <AddPortfolio />}

              <MarketTrends />
              <MostFollowed />
            </div>
          </div>
          <MarketTrendsList />
          <DiscoverMore />
          <Footer />
        </div>
      </Layout>
    </>
  );
};

export default Home;
