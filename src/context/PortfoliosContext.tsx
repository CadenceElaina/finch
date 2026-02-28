import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useMemo,
} from "react";
import portfolioService from "../services/portfolios";
import { Portfolio, Security } from "../types/types";

/* export interface Portfolio {
  id: string;
  title: string;
  author: string | undefined;
} */

interface PortfoliosContextProps {
  portfolios: Portfolio[];
  appendPortfolio: (newPortfolio: Portfolio) => void;
  removePortfolio: (removedPortfolio: Portfolio) => void;
  addSecurityToPortfolio: (portfolioId: string, security: Security) => void;
}

const PortfoliosContext = createContext<PortfoliosContextProps | undefined>(
  undefined
);

export const PortfoliosProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);

  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        const portfoliosData = await portfolioService.getAll();
        setPortfolios(portfoliosData);
      } catch (error) {
        console.error("Error fetching portfolios:", error);
      }
    };

    fetchPortfolios();
  }, []); // Fetch portfolios on component mount

  const appendPortfolio = (newPortfolio: Portfolio) => {
    setPortfolios((prevPortfolios) => [...prevPortfolios, newPortfolio]);
  };

  const removePortfolio = async (removedPortfolio: Portfolio) => {
    try {
      // Remove the portfolio from the server
      await portfolioService.remove(removedPortfolio.id);

      // Update the portfolios state
      setPortfolios((prevPortfolios) =>
        prevPortfolios.filter((p) => p.id !== removedPortfolio.id)
      );
    } catch (error) {
      console.error("Error removing portfolio:", error);
      // Handle error as needed
    }
  };
  /*   const removePortfolio = (removedPortfolio: Portfolio) => {
    setPortfolios(portfolios.filter((p) => p.id !== removedPortfolio.id));
  }; */

  const addSecurityToPortfolio = async (
    portfolioId: string,
    security: Security
  ) => {
    const updatedPortfolios = portfolios.map((portfolio) =>
      portfolio.id === portfolioId
        ? {
            ...portfolio,
            securities: [...(portfolio.securities ?? []), security],
          }
        : portfolio
    );

    setPortfolios(updatedPortfolios);

    // Update the server with the new security
    await portfolioService.addToPortfolio(portfolioId, security);
  };

  const contextValue = useMemo(
    () => ({
      portfolios,
      appendPortfolio,
      removePortfolio,
      addSecurityToPortfolio,
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

/* export const usePortfolios = () => {
  const context = useContext(PortfoliosContext);
  if (!context) {
    throw new Error("usePortfolios must be used within a PortfoliosProvider");
  }
  return { ...context, removePortfolio: context.removePortfolio };
};
 */
