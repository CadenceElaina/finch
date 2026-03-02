import React, { useState, useCallback } from "react";
import { articleProps } from "../../../types/types";
import ScrollRow from "../ScrollRow";
import "./QuoteNews.css";

/** Image with fallback for broken/missing thumbnails */
const CardImage: React.FC<{ src?: string; alt: string }> = ({ src, alt }) => {
  const [failed, setFailed] = useState(false);
  const handleError = useCallback(() => setFailed(true), []);

  if (!src || failed) {
    return <div className="qnc-img-placeholder" />;
  }
  return (
    <img
      src={src}
      alt={alt}
      className="qnc-img"
      onError={handleError}
      loading="lazy"
    />
  );
};

const QuoteArticles: React.FC<articleProps> = ({ articles, symbol }) => {
  let filteredArticles: typeof articles;
  let heading: string;

  if (symbol === "__general__") {
    // General news for instruments (indexes, crypto, currencies)
    filteredArticles = articles.slice(0, 6);
    heading = "In the news";
  } else {
    filteredArticles = articles
      .filter((article) => article.relatedSymbol === symbol)
      .slice(0, 6);
    heading = "Related news";
    if (filteredArticles.length === 0) {
      filteredArticles = articles.slice(0, 6);
      heading = "Top news";
    }
  }

  if (filteredArticles.length === 0) return null;

  return (
    <div className="qnc-section">
      <div className="qnc-heading" role="heading">
        {heading}
      </div>
      <ScrollRow className="qnc-grid">
        {filteredArticles.map((article) => (
          <a
            key={article.id}
            className="qnc-card"
            href={article.link && article.link !== "#" ? article.link : undefined}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="qnc-img-wrap">
              <CardImage src={article.img} alt={article.title} />
            </div>
            <div className="qnc-body">
              <span className="qnc-source">{article.source}</span>
              <span className="qnc-title">{article.title}</span>
              <span className="qnc-time">{article.time}</span>
            </div>
          </a>
        ))}
      </ScrollRow>
    </div>
  );
};

export default QuoteArticles;
