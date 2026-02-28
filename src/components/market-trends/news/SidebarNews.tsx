import Article from "./Article";
import "../MarketTrends.css";
import { useNews } from "../../../context/NewsContext";

const SidebarNews = () => {
  const newsData = useNews();

  // Generate 9 random articles
  const numRandomArticles = 6;
  const randomIndexes = Array.from(
    { length: Math.min(numRandomArticles, newsData.length) },
    () => Math.floor(Math.random() * newsData.length)
  );

  // Get the selected random articles from newsData
  const randomArticles = randomIndexes.map((index) => newsData[index]);

  return (
    <div className="sidebar-news">
      Sidebar News
      <div>
        <div role="heading" className="news-heading">
          Today's financial news
        </div>
        <div>
          <Article articles={randomArticles} />
        </div>
      </div>
    </div>
  );
};

export default SidebarNews;
