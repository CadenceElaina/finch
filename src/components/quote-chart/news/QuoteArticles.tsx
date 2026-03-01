import React from "react";
import { useNavigate } from "react-router-dom";
import { articleProps } from "../../../types/types";
import "../../left-column/news/news.css";

const QuoteArticles: React.FC<articleProps> = ({ articles, symbol }) => {
  let filteredArticles = articles
    .filter((article) => article.relatedSymbol === symbol)
    .slice(0, 10);
  let heading = `Top news related to ${symbol}`;
  if (filteredArticles.length === 0) {
    filteredArticles = articles.slice(0, 5);
    heading = "Top news";
  }
  const navigate = useNavigate();

  const handleArticleClick = (link: string) => {
    if (link && link !== "#") {
      window.open(link, "_blank", "noopener,noreferrer");
    }
  };
  const handleSymbolClick = (sym: string) => {
    navigate(`/quote/${sym}`);
  };
  return (
    <div>
      <div role="heading" className="quote-news-heading">
        {heading}
      </div>
      {filteredArticles.map((article) => (
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
