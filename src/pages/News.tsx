import { useState } from "react";
import Layout from "../components/layout/Layout";
import Footer from "../components/Footer";
import Search from "../components/search/Search";
import CustomButton from "../components/CustomButton";
import ArticleCard from "../components/news/ArticleCard";
import { useNews } from "../context/NewsContext";
import { NewsSegmentType } from "../types/types";
import "./News.css";

const SEGMENTS: NewsSegmentType[] = ["Top", "Local", "World"];

const News = () => {
  const { newsData } = useNews();
  const [segment, setSegment] = useState<NewsSegmentType>("Top");

  const filtered =
    segment === "Top"
      ? newsData
      : newsData.filter((a) =>
          Array.isArray(a.segment)
            ? a.segment.includes(segment)
            : a.segment === segment
        );

  return (
    <Layout>
      <div className="news-page-container">
        <Search />
        <div className="news-page-heading">Today's financial news</div>
        <div className="news-page-filters">
          {SEGMENTS.map((s) => (
            <CustomButton
              key={s}
              label={s}
              tertiary
              onClick={() => setSegment(s)}
              active={segment === s}
            />
          ))}
        </div>

        {newsData.length === 0 ? (
          <div className="news-page-empty">
            <p>Unable to load news right now.</p>
            <p>Check back in a few minutes.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="news-page-empty">
            <p>No "{segment}" articles available.</p>
          </div>
        ) : (
          filtered.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))
        )}
      </div>
      <Footer />
    </Layout>
  );
};

export default News;
