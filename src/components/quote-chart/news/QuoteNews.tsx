import { useEffect } from "react";
import QuoteArticles from "./QuoteArticles";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSymbolsNews } from "../../left-column/news/newsUtils"; // Replace with the actual path
import { useLocation } from "react-router-dom";
import "./QuoteNews.css";

const QuoteNews = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const symbol = location.pathname.split("/").pop() || "";

  // Use react-query to fetch data for news articles
  const {
    data: newsData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["symbolNews", symbol],
    queryFn: () => getSymbolsNews(symbol), // Pass the symbol directly
    enabled: Boolean(symbol), // Only fetch data when symbol is available
  });

  useEffect(() => {
    // Prefetch news data for better user experience
    if (symbol) {
      queryClient.prefetchQuery({
        queryKey: ["symbolNews", symbol],
        queryFn: () => getSymbolsNews(symbol),
      });
    }
  }, [queryClient, symbol]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error loading news data.</div>;
  }
  //console.log(newsData);

  return (
    <div className="quote-news-container">
      <div>
        <QuoteArticles articles={newsData || []} symbol={symbol} />
      </div>
    </div>
  );
};

export default QuoteNews;
