import QuoteArticles from "./QuoteArticles";
import { useQuery } from "@tanstack/react-query";
import { getSymbolsNews } from "../../left-column/news/newsUtils";
import { useLocation } from "react-router-dom";
import { useNews } from "../../../context/NewsContext";
import "./QuoteNews.css";

import { CACHE_POLICY } from "../../../config/api";

interface QuoteNewsProps {
  /** When true, show general market news instead of symbol-specific news */
  useGeneralNews?: boolean;
}

const QuoteNews: React.FC<QuoteNewsProps> = ({ useGeneralNews = false }) => {
  const location = useLocation();
  const symbol = location.pathname.split("/").pop() || "";
  const { newsData: generalNews } = useNews();

  const {
    data: symbolNewsData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["symbolNews", symbol],
    queryFn: () => getSymbolsNews(symbol),
    enabled: Boolean(symbol) && !useGeneralNews,
    staleTime: CACHE_POLICY.newsRefreshInterval,
    gcTime: CACHE_POLICY.newsRefreshInterval * 2,
  });

  // Use general news for instruments, symbol-specific for stocks
  const newsData = useGeneralNews ? generalNews : symbolNewsData;

  if (!useGeneralNews && isLoading) {
    return (
      <div className="quote-news-container">
        <div className="quote-news-skeleton" style={{ flexDirection: "row", gap: "12px", minHeight: "180px" }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="quote-news-skeleton-row" style={{ flexDirection: "column", minWidth: "220px", flex: "0 0 auto" }}>
              <div className="quote-news-skeleton-thumb" style={{ width: "100%", height: "100px", borderRadius: "8px" }} />
              <div className="quote-news-skeleton-lines">
                <div className="quote-news-skeleton-line short" />
                <div className="quote-news-skeleton-line" />
                <div className="quote-news-skeleton-line medium" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!useGeneralNews && (isError || !newsData || newsData.length === 0)) {
    return null; // Don't show empty news section
  }

  if (!newsData || newsData.length === 0) {
    return null;
  }

  return (
    <div className="quote-news-container">
      <QuoteArticles articles={newsData} symbol={useGeneralNews ? "__general__" : symbol} />
    </div>
  );
};

export default QuoteNews;
