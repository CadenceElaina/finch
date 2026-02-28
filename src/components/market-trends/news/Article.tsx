import React from "react";
import { articleProps } from "../../../types/types";

const Article: React.FC<articleProps> = ({ articles }) => {
  return (
    <div>
      Article
      {articles.map((article) => (
        <div key={article.id} className="story-container">
          <div className="story-row">
            <div className="story-column">
              <div className="story-source-time">
                <div className="source">{article.source}</div>
                <div className="time">{article.time}</div>
              </div>
              <div className="title">{article.title}</div>
              <div className="related-symbol">{article.relatedSymbol}</div>
            </div>
            <div className="story-column-image">
              <img
                src={article.img}
                alt={article.title}
                className="story-image"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Article;
