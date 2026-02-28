import React, { useEffect, useState } from "react";
import { Portfolio, Security } from "../../types/types";
import Table from "../table/Table";
import { RowConfig } from "../table/types";
import { quoteType } from "../search/types";
import {
  Data,
  transformQuotesToDataWithQuantities,
} from "../market-trends/utils";
import { getBatchQuotes } from "../search/quoteUtils";
import { useQueryClient } from "@tanstack/react-query";
import { portfolioStorage } from "../../services/storage";
import PortfolioChart from "../PortfolioChart";
import "./Portfolio.css";

interface PortfolioPerformanceProps {
  portfolio: Portfolio;
}

const PortfolioPerformance: React.FC<PortfolioPerformanceProps> = ({
  portfolio,
}) => {
  //const [symbols, setSymbols] = useState<string[]>([]);
  const [quotes, setQuotes] = useState<Data[]>();
  /*   const [chartData, setChartData] = useState([
    ["Date", "Value of portfolio"],
    ["Dec 21, 2023", 0],
  ]); */
  const [portfolioPerformance, setPortfolioPerformance] = useState({
    totalPriceChange: 0,
    totalPercentChange: 0,
  });
  const queryClient = useQueryClient();

  const portfolioConfig: RowConfig = {
    fields: [
      "symbol",
      "name",
      "price",
      "quantity",
      "priceChange",
      "percentChange",
    ],
    addIcon: true,
  };

  const fetchQuotesForSymbols = async () => {
    const symbols = portfolio?.securities?.map((s: Security) => s.symbol);
    if (!symbols || symbols.length === 0) {
      return;
    }
    const symbolQuoteMap = await getBatchQuotes(queryClient, symbols);
    const transformedData: Data[] = transformQuotesToDataWithQuantities(
      symbolQuoteMap,
      portfolio
    );
    const convertToNumber = (str: string) => parseFloat(str);
    // Calculate total price change and total percent change
    const totalPriceChange = transformedData.reduce(
      (total, item) =>
        total +
        convertToNumber(item.priceChange.toString()) * (item.quantity ?? 0),
      0
    );
    const formattedTotalPriceChange = Number(totalPriceChange.toFixed(2));
    const totalQuantity = transformedData.reduce(
      (tq, security) => (tq += security.quantity ?? 0),
      0
    );
    const overallPercentChange =
      transformedData.reduce(
        (pc, curr) => (pc += curr.percentChange * (curr.quantity ?? 0)),
        0
      ) / totalQuantity;
    const formattedOverallPercentChange = Number(
      overallPercentChange.toFixed(2)
    );

    setQuotes(transformedData);
    const totalValue = transformedData.reduce(
      (value, security) => (value += security.price * (security.quantity ?? 0)),
      0
    );
    setPortfolioPerformance({
      totalPriceChange: formattedTotalPriceChange,
      totalPercentChange: formattedOverallPercentChange,
    });
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    // Check if the current date is already present in portfolioValue
    const isCurrentDatePresent = portfolio?.portfolioValue?.some(
      (entry) => entry.date === formattedDate
    );
    const dayOfWeek = currentDate.getDay(); // 0 for Sunday, 1 for Monday, etc.
    // Check if the day is not Saturday (6) or Sunday (0)
    if (!isCurrentDatePresent && dayOfWeek !== 0 && dayOfWeek !== 6) {
      portfolioStorage.updateValue(portfolio.id, {
        date: formattedDate,
        value: Number(totalValue.toFixed(2)),
      });
    }

    /*     setChartData([formattedDate, formattedTotalPriceChange]) */
  };

  useEffect(() => {
    const symbols = portfolio?.securities?.map((s: Security) => s.symbol);
    if (symbols && symbols.length > 0) {
      fetchQuotesForSymbols();
    }
  }, [portfolio, queryClient]);

  interface PortfolioValueEntry {
    date: string;
    value: number | string;
  }
  const convertPortfolioValueToNumbers = (
    portfolioValue: PortfolioValueEntry[]
  ) => {
    return portfolioValue.map((entry: PortfolioValueEntry) => ({
      date: entry.date,
      value:
        typeof entry.value === "string" ? parseFloat(entry.value) : entry.value,
    }));
  };
  const updatedPortfolioValue = convertPortfolioValueToNumbers(
    portfolio?.portfolioValue || []
  );
  return (
    <div className="portfolio-performance-container">
      <div className="top-row">
        <div className="portfolio-chart-container">
          {portfolio && portfolio.title && portfolio.portfolioValue && (
            <PortfolioChart
              chartName={portfolio.title ?? ""}
              data={updatedPortfolioValue || []}
            />
          )}
        </div>
        <div className="portfolio-highlights">
          <div role="heading">Portfolio highlights</div>
          <div className="portfolio-day-total-change">
            <div
              className={`portfolio-day-${
                portfolioPerformance.totalPriceChange > 0 ? "gain" : portfolioPerformance.totalPriceChange < 0 ? "loss" : ""
              }`}
            >
              Day{" "}
              {portfolioPerformance.totalPriceChange > 0 ? "gain" : portfolioPerformance.totalPriceChange === 0 ? "" : "loss"}
              <div
                className={`portfolio-day-change-${
                  portfolioPerformance.totalPriceChange > 0 ? "gain" : portfolioPerformance.totalPriceChange === 0 ? "" : "loss"
                }`}
              >
                <div>{portfolioPerformance.totalPriceChange}</div>
                <div>{portfolioPerformance.totalPercentChange}</div>
              </div>
            </div>
            <div
              className={`total-${
                portfolioPerformance.totalPriceChange > 0
                  ? "gain"
                  : portfolioPerformance.totalPriceChange === 0
                  ? ""
                  : "loss"
              }`}
            >
              Total{" "}
              {portfolioPerformance.totalPriceChange > 0
                ? "gain"
                : portfolioPerformance.totalPriceChange === 0
                ? ""
                : "loss"}
              <div
                className={`portfolio-total-change-${
                  portfolioPerformance.totalPriceChange > 0 ? "gain" : portfolioPerformance.totalPriceChange === 0 ? "" : "loss"
                }`}
              >
                <div>{portfolioPerformance.totalPriceChange}</div>
                <div>{portfolioPerformance.totalPercentChange}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bottom-row">
        <div className="portfolio-performance-list">
          {portfolio && portfolio.securities && quotes && (
            <Table
              data={quotes}
              config={portfolioConfig}
              full={true}
              icon={false}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PortfolioPerformance;
