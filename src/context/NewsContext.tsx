import React, { createContext, useContext, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getNews } from "../components/left-column/news/newsUtils";
import { Article } from "../types/types";

interface NewsContextProps {
  newsData: Article[];
}

const NewsContext = createContext<NewsContextProps | undefined>(undefined);

export const NewsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [newsData, setNewsData] = useState<Article[]>([]);
  const queryClient = useQueryClient();

  // TODO: re-enable after verifying quote calls work
  // useEffect(() => {
  //   const fetchNewsData = async () => {
  //     const data = await getNews(queryClient);
  //     setNewsData(data);
  //   };
  //   fetchNewsData();
  // }, [queryClient]);

  return (
    <NewsContext.Provider value={{ newsData }}>{children}</NewsContext.Provider>
  );
};

export const useNews = () => {
  const context = useContext(NewsContext);
  if (!context) {
    throw new Error("useNews must be used within a NewsProvider");
  }
  return context.newsData;
};
