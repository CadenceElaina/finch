import { useState } from "react";
import { newsSegmentType } from "../../../types/types";
import CustomButton from "../../CustomButton";
import Articles from "./Articles";
import { useNews } from "../../../context/NewsContext";

const News = () => {
  const [currNewsSegment, setCurrNewsSegment] =
    useState<newsSegmentType>("Top");
  const newsData = useNews();
  const newsSegmentValues: newsSegmentType[] = ["Top", "Local", "World"];
  /*   const [isLoading, setIsLoading] = useState(true); */

  const handleButtonClick = (segment: newsSegmentType) => {
    setCurrNewsSegment(segment);
  };
  //console.log(newsData);
  return (
    <div>
      <div role="heading" className="news-heading">
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

export default News;
