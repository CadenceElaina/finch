import React from "react";
import { useNavigate } from "react-router-dom";
import { articleProps } from "../../../types/types";
import "../../left-column/news/news.css";
import { Skeleton } from "@mui/material";

const QuoteArticles: React.FC<articleProps> = ({ articles, symbol }) => {
  let filteredArticles = articles
    .filter((article) => article.relatedSymbol === symbol)
    .slice(0, 10); // Limit to 10 articles;
  let useHeading = true;
  if (filteredArticles.length === 0) {
    filteredArticles = articles.slice(0, 5);
    useHeading = !useHeading;
  }
  const navigate = useNavigate();
  const loadingSkeleton = (
    <div className="story-container">
      <div className="story-row">
        <div className="story-column">
          <div className="skeleton-source-time">
            <Skeleton
              variant="text"
              width={80}
              height={20}
              sx={{ bgcolor: "rgba(255, 255, 255, 0.1)" }}
            />
          </div>
          <Skeleton
            variant="text"
            width="100%"
            height={30}
            sx={{ bgcolor: "rgba(255, 255, 255, 0.1)" }}
          />
          <Skeleton
            variant="rectangular"
            width="100%"
            height={150}
            sx={{ bgcolor: "rgba(255, 255, 255, 0.1)" }}
          />
        </div>
      </div>
    </div>
  );
  const handleArticleClick = (link: string) => {
    location.href = `${link}`;
  };
  const handleSymbolClick = (symbol: string) => {
    navigate(`/quote/${symbol}`);
  };
  // console.log(articles, filteredArticles);
  return (
    <div>
      <div role="heading" className="quote-news-heading">
        Top news {useHeading ? `related to ${symbol}` : ""}
      </div>
      {filteredArticles.length < 1
        ? // Display loading skeletons when articles are not loaded
          Array.from({ length: 3 }).map((_, index) => (
            <React.Fragment key={index}>{loadingSkeleton}</React.Fragment>
          ))
        : // Display actual articles when loaded
          filteredArticles.map((article) => (
            <div key={article.id} className="story-container">
              <div className="story-row">
                <div className="story-column">
                  <div
                    className="story-source-time"
                    onClick={() => handleArticleClick(article.link)}
                  >
                    <div className="source">{article.source}</div>
                    <div className="time">{article.time}</div>
                  </div>
                  <div
                    className="title"
                    onClick={() => handleArticleClick(article.link)}
                  >
                    {article.title}
                  </div>
                  <div
                    className="related-symbol"
                    onClick={() => handleSymbolClick(article.relatedSymbol)}
                  >
                    {article.relatedSymbol}
                  </div>
                </div>
                <div className="story-column-image">
                  <img
                    src={article.img}
                    alt={article.title}
                    className="story-image"
                    onClick={() => handleArticleClick(article.link)}
                  />
                </div>
              </div>
            </div>
          ))}
    </div>
  );
};

export default QuoteArticles;
