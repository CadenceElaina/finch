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
import { DEFAULT_PORTFOLIOS } from "../data/demo/defaultLists";

interface PortfoliosContextProps {
  portfolios: Portfolio[];
  appendPortfolio: (newPortfolio: Portfolio) => void;
  removePortfolio: (removedPortfolio: Portfolio) => void;
  renamePortfolio: (portfolioId: string, newTitle: string) => void;
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
    const stored = portfolioStorage.getAll();
    const seeded = localStorage.getItem("finch_demo_portfolios_seeded");
    let list: Portfolio[];
    if (seeded) {
      list = stored;
    } else {
      // First visit or never seeded — merge defaults with any existing data
      const existingIds = new Set(stored.map((p) => p.title));
      const toAdd = DEFAULT_PORTFOLIOS.filter((p) => !existingIds.has(p.title));
      list = [...stored, ...toAdd];
      localStorage.setItem("finch_demo_portfolios_seeded", "1");
    }

    // Ensure isDemo flag is set on any demo portfolio (covers pre-flag seeded data)
    const demoTitles = new Set(DEFAULT_PORTFOLIOS.map((p) => p.title));
    let patched = false;
    for (const p of list) {
      if (demoTitles.has(p.title) && !p.isDemo) {
        p.isDemo = true;
        patched = true;
      }
    }

    // v2: Refresh demo portfolio value histories (fixes incorrect synth values)
    const seedVersion = Number(seeded || "0");
    if (seedVersion < 2) {
      const demoByTitle = new Map(DEFAULT_PORTFOLIOS.map((dp) => [dp.title, dp]));
      for (const p of list) {
        const freshDemo = demoByTitle.get(p.title);
        if (p.isDemo && freshDemo) {
          p.portfolioValue = freshDemo.portfolioValue;
          patched = true;
        }
      }
      localStorage.setItem("finch_demo_portfolios_seeded", "2");
    }

    if (patched || !seeded) {
      localStorage.setItem("finch_portfolios", JSON.stringify(list));
    }
    setPortfolios(list);
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

  const renamePortfolio = (portfolioId: string, newTitle: string) => {
    portfolioStorage.rename(portfolioId, newTitle);
    setPortfolios((prev) =>
      prev.map((p) =>
        p.id === portfolioId ? { ...p, title: newTitle } : p
      )
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
      renamePortfolio,
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
