import Article from "./Article";
import "../MarketTrends.css";
import { useNews } from "../../../context/NewsContext";

const SidebarNews = () => {
  const newsData = useNews();

  // Pick up to 6 unique random articles using Fisher-Yates shuffle
  const numRandomArticles = Math.min(6, newsData.length);
  const shuffled = [...newsData].sort(() => Math.random() - 0.5);
  const randomArticles = shuffled.slice(0, numRandomArticles);

  return (
    <div className="sidebar-news">
      {newsData.length > 0 && (
        <div>
          <div role="heading" className="news-heading">
            Today's financial news
          </div>
          <div>
            <Article articles={randomArticles} />
          </div>
        </div>
      )}
    </div>
  );
};

export default SidebarNews;
