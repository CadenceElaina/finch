import { useMemo } from "react";
import Article from "./Article";
import "../MarketTrends.css";
import "../../left-column/news/news.css";
import { useNews } from "../../../context/NewsContext";
import { Article as ArticleType } from "../../../types/types";

/** Fisher-Yates (Knuth) shuffle — unbiased random permutation. */
const fisherYatesShuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const SidebarNews = () => {
  const { newsData } = useNews();

  // Shuffle once when newsData changes — not on every render
  const randomArticles: ArticleType[] = useMemo(() => {
    if (newsData.length === 0) return [];
    return fisherYatesShuffle(newsData).slice(0, 6);
  }, [newsData]);

  if (newsData.length === 0) return null;

  return (
    <div className="sidebar-news">
      <div role="heading" className="news-heading">
        Today's financial news
      </div>
      <Article articles={randomArticles} />
    </div>
  );
};

export default SidebarNews;
