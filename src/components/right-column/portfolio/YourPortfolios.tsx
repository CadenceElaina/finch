import { useEffect, useState } from "react";
import { FaChartBar } from "react-icons/fa";
import { usePortfolios } from "../../../context/PortfoliosContext";
import CustomButton from "../../CustomButton";
import { portfolioStorage } from "../../../services/storage";
import { Link, useNavigate } from "react-router-dom";
import NewPortfolioModal from "../../modals/AddPortfolioModal";
import "./Portfolio.css";
import { Skeleton } from "@mui/material";

import { useQueryClient } from "@tanstack/react-query";
import { quoteType } from "../../search/types";
import { getBatchQuotes } from "../../search/quoteUtils";
import { PortfolioSymbols } from "../../../types/types";

const YourPortfolios = () => {
  const { portfolios, appendPortfolio } = usePortfolios();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const portfolioSymbols: PortfolioSymbols = {};
  // Populate the object with symbols and quantities
  portfolios.forEach((portfolio) => {
    const symbolsWithQuantities =
      portfolio.securities?.reduce((acc, security) => {
        acc[security.symbol] = security.quantity;
        return acc;
      }, {} as { [symbol: string]: number }) || {};

    portfolioSymbols[portfolio.title] = symbolsWithQuantities;
  });

  const queryClient = useQueryClient();
  const [portfolioQuotes, setPortfolioQuotes] = useState<
    Record<
      string,
      {
        symbol: string;
        price: number;
        percentChange: number;
        quantity: number;
      }[]
    >
  >({});
  const [quoteCache, setQuoteCache] = useState<
    Record<string, quoteType | null>
  >({});
  const fetchPortfolioQuotes = async (portfolioTitle: string) => {
    const symbolsWithQuantities = portfolioSymbols[portfolioTitle];
    const allSymbols = Object.keys(symbolsWithQuantities);

    const batchResult = await getBatchQuotes(queryClient, allSymbols);

    const quotes = allSymbols.map((symbol) => {
      const quoteData = batchResult[symbol] ?? quoteCache[symbol];
      const quantity = symbolsWithQuantities[symbol];

      // Update the cache
      if (quoteData && !quoteCache[symbol]) {
        setQuoteCache((prevCache) => ({
          ...prevCache,
          [symbol]: quoteData,
        }));
      }

      return {
        symbol,
        price: quoteData?.price || 0,
        percentChange: quoteData?.percentChange || 0,
        quantity,
      };
    });

    setPortfolioQuotes((prevQuotes) => ({
      ...prevQuotes,
      [portfolioTitle]: quotes,
    }));
  };

  useEffect(() => {
    // Fetch quotes for each portfolio
    if (portfolios.length > 0) {
      portfolios.forEach((portfolio) => {
        fetchPortfolioQuotes(portfolio.title);
        setIsLoading(false);
      });
    }
  }, [portfolios]);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };
  const handleSavePortfolio = (portfolioName: string) => {
    const response = portfolioStorage.create({
      title: portfolioName,
    });
    appendPortfolio(response);

    closeModal();
    navigate(`/portfolio/${response.id}`);
  };

  const canCreateNewPortfolio = () => {
    return portfolios.length < 3;
  };

  const Tooltip = () => (
    <div className="tooltip">You may not have more than 3 portfolios</div>
  );

  const totalPortfolioValue = portfolios.reduce((acc, portfolio) => {
    const securities = portfolioQuotes[portfolio.title] || [];
    const portfolioValue = securities.reduce((valueAcc, security) => {
      return valueAcc + security.price * security.quantity;
    }, 0);

    return acc + portfolioValue;
  }, 0);
  return (
    <div className="add-portfolio-container">
      <div className="add-portfolio-header">
        {/* Portfolio/Graph icon */}
        <div className="add-portfolio-icon">
          <FaChartBar size={30} />
        </div>
        <div className="add-portfolio-text">Your portfolios</div>
      </div>
      <div className="portfolio-value">
        {isLoading && portfolios.length > 0 ? (
          <Skeleton
            variant="text"
            width={100}
            height={20}
            sx={{ bgcolor: "rgba(255, 255, 255, 0.1)" }}
          />
        ) : totalPortfolioValue ? (
          `$${totalPortfolioValue.toFixed(2)}`
        ) : (
          "$0.00"
        )}
      </div>
      <div className="border-top"></div>
      {portfolios.length > 0 ? (
        <div className="portfolio-list">
          {isLoading ? (
            <>
              <Skeleton
                variant="rounded"
                width={300}
                height={50}
                sx={{ bgcolor: "rgba(255, 255, 255, 0.1)" }}
                style={{ marginBottom: "10px" }}
              />
              <Skeleton
                variant="rounded"
                width={300}
                height={50}
                sx={{ bgcolor: "rgba(255, 255, 255, 0.1)" }}
                style={{ marginBottom: "10px" }}
              />
              <Skeleton
                variant="rounded"
                width={300}
                height={50}
                sx={{ bgcolor: "rgba(255, 255, 255, 0.1)" }}
                style={{ marginBottom: "10px" }}
              />
            </>
          ) : (
            portfolios.map((portfolio) => {
              const securities = portfolioQuotes[portfolio.title] || [];
              const totalValue = securities.reduce((acc, security) => {
                const { quantity, percentChange } = security;
                const securityValueChange = quantity * percentChange;
                return acc + securityValueChange;
              }, 0);

              const totalQuantity = securities.reduce((acc, security) => {
                return acc + security.quantity;
              }, 0);

              const totalPercentChange =
                totalQuantity !== 0 ? (totalValue / totalQuantity) * 100 : 0;

              const portfolioValue = securities.reduce((acc, security) => {
                return acc + security.price * security.quantity;
              }, 0);

              return (
                <div key={portfolio.id} className="portfolio">
                  <div className="portfolio-inner">
                    <Link
                      to={`/portfolio/${portfolio.id}`}
                      style={{ textDecoration: "none", color: "white" }}
                      className="portfolio-link"
                    >
                      <span className="portfolio-label">{portfolio.title}</span>
                      <span className="portfolio-value">
                        {portfolioValue
                          ? `$${portfolioValue.toFixed(2)}`
                          : "$0.00"}
                      </span>
                      <span
                        className={`portfolio-percent-change ${
                          totalPercentChange > 0
                            ? "p-positive"
                            : totalPercentChange < 0
                            ? "p-negative"
                            : ""
                        }`}
                      >
                        {totalPercentChange.toFixed(2)}%
                      </span>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : null}
      <div className="add-portfolio-button">
        {canCreateNewPortfolio() ? (
          <CustomButton
            label="New Portfolio"
            onClick={openModal}
            fullWidth
            large
          />
        ) : (
          <>
            <CustomButton
              label="New Portfolio"
              onClick={openModal}
              fullWidth
              large
              disabled
            />
            <Tooltip />
          </>
        )}
      </div>
      {isModalOpen && (
        <NewPortfolioModal onCancel={closeModal} onSave={handleSavePortfolio} />
      )}
    </div>
  );
};

export default YourPortfolios;
