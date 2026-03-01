import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { NewsSegmentType } from "../../../types/types";
import CustomButton from "../../CustomButton";
import Articles from "./Articles";
import { useNews } from "../../../context/NewsContext";
import "./news.css";
import ErrorState from "../../ErrorState";

const HomeNews = () => {
  const [currNewsSegment, setCurrNewsSegment] =
    useState<NewsSegmentType>("Top");
  const { newsData, isLoading } = useNews();
  const navigate = useNavigate();
  const newsSegmentValues: NewsSegmentType[] = ["Top", "Local", "World"];

  const handleButtonClick = (segment: NewsSegmentType) => {
    setCurrNewsSegment(segment);
  };

  // Finished loading but got nothing — show empty state
  if (!isLoading && newsData.length === 0) {
    return (
      <div>
        <div role="heading" className="news-heading">
          Today's financial news
        </div>
        <ErrorState
          message="Unable to load news right now."
          onRetry={() => window.location.reload()}
          compact
        />
      </div>
    );
  }

  return (
    <div>
      <div
        role="heading"
        className="news-heading"
        style={{ cursor: "pointer" }}
        onClick={() => navigate("/news")}
      >
        Today's financial news
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        {newsSegmentValues.map((segment) => (
          <CustomButton
            key={segment}
            label={segment}
            tertiary={true}
            onClick={() => handleButtonClick(segment)}
            active={currNewsSegment === segment}
          />
        ))}
      </div>
      <div>
        <Articles articles={newsData} currNewsSegment={currNewsSegment} />
      </div>
    </div>
  );
};

export default HomeNews;
