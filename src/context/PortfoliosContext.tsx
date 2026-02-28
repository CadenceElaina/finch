import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useMemo,
} from "react";
import { portfolioStorage } from "../services/storage";
import { Portfolio, Security } from "../types/types";

interface PortfoliosContextProps {
  portfolios: Portfolio[];
  appendPortfolio: (newPortfolio: Portfolio) => void;
  removePortfolio: (removedPortfolio: Portfolio) => void;
  addSecurityToPortfolio: (portfolioId: string, security: Security) => void;
  removeSecurityFromPortfolio: (portfolioId: string, symbol: string) => void;
}

const PortfoliosContext = createContext<PortfoliosContextProps | undefined>(
  undefined
);

export const PortfoliosProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);

  useEffect(() => {
    setPortfolios(portfolioStorage.getAll());
  }, []);

  const appendPortfolio = (newPortfolio: Portfolio) => {
    setPortfolios((prevPortfolios) => [...prevPortfolios, newPortfolio]);
  };

  const removePortfolio = (removedPortfolio: Portfolio) => {
    portfolioStorage.remove(removedPortfolio.id);
    setPortfolios((prevPortfolios) =>
      prevPortfolios.filter((p) => p.id !== removedPortfolio.id)
    );
  };

  const addSecurityToPortfolio = (
    portfolioId: string,
    security: Security
  ) => {
    portfolioStorage.addSecurity(portfolioId, security);
    setPortfolios((prev) =>
      prev.map((portfolio) =>
        portfolio.id === portfolioId
          ? {
              ...portfolio,
              securities: [...(portfolio.securities ?? []), security],
            }
          : portfolio
      )
    );
  };

  const removeSecurityFromPortfolio = (
    portfolioId: string,
    symbol: string
  ) => {
    portfolioStorage.removeSecurity(portfolioId, symbol);
    setPortfolios((prev) =>
      prev.map((portfolio) =>
        portfolio.id === portfolioId
          ? {
              ...portfolio,
              securities: (portfolio.securities ?? []).filter(
                (s) => s.symbol !== symbol
              ),
            }
          : portfolio
      )
    );
  };

  const contextValue = useMemo(
    () => ({
      portfolios,
      appendPortfolio,
      removePortfolio,
      addSecurityToPortfolio,
      removeSecurityFromPortfolio,
    }),
    [portfolios]
  );

  return (
    <PortfoliosContext.Provider
      value={contextValue}
      /*   value={{ portfolios, appendPortfolio, removePortfolio }} */
    >
      {children}
    </PortfoliosContext.Provider>
  );
};
export const usePortfolios = () => {
  const context = useContext(PortfoliosContext);
  if (!context) {
    throw new Error("usePortfolios must be used within a PortfoliosProvider");
  }
  return context;
};
