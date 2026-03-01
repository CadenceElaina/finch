import QuoteArticles from "./QuoteArticles";
import { useQuery } from "@tanstack/react-query";
import { getSymbolsNews } from "../../left-column/news/newsUtils";
import { useLocation } from "react-router-dom";
import "./QuoteNews.css";

import { CACHE_POLICY } from "../../../config/api";

const QuoteNews = () => {
  const location = useLocation();
  const symbol = location.pathname.split("/").pop() || "";

  const {
    data: newsData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["symbolNews", symbol],
    queryFn: () => getSymbolsNews(symbol),
    enabled: Boolean(symbol),
    staleTime: CACHE_POLICY.newsRefreshInterval,
    gcTime: CACHE_POLICY.newsRefreshInterval * 2,
  });

  if (isLoading) {
    return (
      <div className="quote-news-container">
        <div className="quote-news-skeleton">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="quote-news-skeleton-row">
              <div className="quote-news-skeleton-line short" />
              <div className="quote-news-skeleton-line" />
              <div className="quote-news-skeleton-line medium" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !newsData || newsData.length === 0) {
    return null; // Don't show empty news section
  }

  return (
    <div className="quote-news-container">
      <QuoteArticles articles={newsData} symbol={symbol} />
    </div>
  );
};

export default QuoteNews;
