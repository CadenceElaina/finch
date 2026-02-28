import React, { createContext, useContext, useState } from "react";
import { quoteType } from "../components/search/types";

interface IndexQuotesContextProps {
  indexQuotesData: quoteType[];
  updateIndexQuotesData: (newData: quoteType[]) => void;
}

const IndexQuotesContext = createContext<IndexQuotesContextProps | undefined>(
  undefined
);

export const IndexQuotesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [indexQuotesData, setIndexQuotesData] = useState<quoteType[]>([]);

  const updateIndexQuotesData = (newData: quoteType[]) => {
    setIndexQuotesData(newData);
  };

  return (
    <IndexQuotesContext.Provider
      value={{ indexQuotesData, updateIndexQuotesData }}
    >
      {children}
    </IndexQuotesContext.Provider>
  );
};

export const useIndexQuotes = (): IndexQuotesContextProps => {
  const context = useContext(IndexQuotesContext);

  if (!context) {
    throw new Error(
      "useIndexQuotes must be used within an IndexQuotesProvider"
    );
  }

  return context;
};
