import React from "react";
import { articleProps } from "../../../types/types";
import ArticleCard from "../../news/ArticleCard";
import "./news.css";
import { Skeleton } from "@mui/material";

const Articles: React.FC<articleProps> = ({ articles, currNewsSegment }) => {
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

  // Filter stories based on the current segment
  let filteredArticles = [];
  if (currNewsSegment) {
    filteredArticles = articles.filter((article) =>
      Array.isArray(article.segment)
        ? article.segment.includes(currNewsSegment)
        : article.segment === currNewsSegment
    );
  } else {
    filteredArticles = articles;
  }

  return (
    <div>
      {filteredArticles.length < 1
        ? Array.from({ length: 3 }).map((_, index) => (
            <React.Fragment key={index}>{loadingSkeleton}</React.Fragment>
          ))
        : filteredArticles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
    </div>
  );
};

export default Articles;
