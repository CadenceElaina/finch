import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Article } from "../../types/types";
import "../left-column/news/news.css";

/** Handles broken / missing images with a placeholder fallback. */
const ArticleImage: React.FC<{ src?: string; alt: string; onClick?: () => void }> = ({
  src,
  alt,
  onClick,
}) => {
  const [failed, setFailed] = useState(false);
  const handleError = useCallback(() => setFailed(true), []);

  if (!src || failed) {
    return <div className="story-image-placeholder" />;
  }
  return (
    <img
      src={src}
      alt={alt}
      className="story-image"
      onClick={onClick}
      onError={handleError}
      loading="lazy"
    />
  );
};

/**
 * Shared article card used by HomeNews, SidebarNews, QuoteNews, and the News page.
 * Renders a single news article with source, time, title, ticker chip, and thumbnail.
 */
const ArticleCard: React.FC<{ article: Article }> = ({ article }) => {
  const navigate = useNavigate();

  const handleArticleClick = () => {
    if (article.link && article.link !== "#") {
      window.open(article.link, "_blank", "noopener,noreferrer");
    }
  };

  const handleSymbolClick = () => {
    if (article.relatedSymbol) {
      navigate(`/quote/${article.relatedSymbol}`);
    }
  };

  return (
    <div className="story-container">
      <div className="story-row">
        <div className="story-column">
          <div className="story-source-time" onClick={handleArticleClick}>
            <div className="source">{article.source}</div>
            <div className="time">{article.time}</div>
          </div>
          <div className="title" onClick={handleArticleClick}>
            {article.title}
          </div>
          {article.relatedSymbol && (
            <div className="related-symbol" onClick={handleSymbolClick}>
              {article.relatedSymbol}
            </div>
          )}
        </div>
        <div className="story-column-image">
          <ArticleImage
            src={article.img}
            alt={article.title}
            onClick={handleArticleClick}
          />
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;
