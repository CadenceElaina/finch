import React from "react";
import { articleProps } from "../../../types/types";
import ArticleCard from "../../news/ArticleCard";
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

  return (
    <div>
      <div role="heading" className="quote-news-heading">
        {heading}
      </div>
      {filteredArticles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
};

export default QuoteArticles;
