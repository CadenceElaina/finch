import React, { createContext, useContext, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getNews } from "../components/left-column/news/newsUtils";
import { Article } from "../types/types";

interface NewsContextProps {
  newsData: Article[];
  isLoading: boolean;
}

const NewsContext = createContext<NewsContextProps | undefined>(undefined);

export const NewsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [newsData, setNewsData] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchNewsData = async () => {
      setIsLoading(true);
      const data = await getNews(queryClient);
      setNewsData(data);
      setIsLoading(false);
    };
    fetchNewsData();
  }, [queryClient]);

  return (
    <NewsContext.Provider value={{ newsData, isLoading }}>{children}</NewsContext.Provider>
  );
};

export const useNews = () => {
  const context = useContext(NewsContext);
  if (!context) {
    throw new Error("useNews must be used within a NewsProvider");
  }
  return context;
};
