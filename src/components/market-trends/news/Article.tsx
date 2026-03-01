import React from "react";
import { articleProps } from "../../../types/types";
import ArticleCard from "../../news/ArticleCard";

const Article: React.FC<articleProps> = ({ articles }) => {
  return (
    <div>
      {articles.map((article, idx) => (
        <ArticleCard key={article.id ?? `article-${idx}`} article={article} />
      ))}
    </div>
  );
};

export default Article;
