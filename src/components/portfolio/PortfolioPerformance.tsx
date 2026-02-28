import React, { useEffect, useState } from "react";
import { Portfolio, Security } from "../../types/types";
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

interface SecurityDetail {
  symbol: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  purchaseDate: string;
  currentPrice: number;
  costBasis: number;
  currentValue: number;
  totalGain: number;
  totalGainPct: number;
  dayChange: number;
  dayChangePct: number;
}

const PortfolioPerformance: React.FC<PortfolioPerformanceProps> = ({
  portfolio,
}) => {
  //const [symbols, setSymbols] = useState<string[]>([]);
  const [securityDetails, setSecurityDetails] = useState<SecurityDetail[]>([]);
  const [portfolioPerformance, setPortfolioPerformance] = useState({
    totalPriceChange: 0,
    totalPercentChange: 0,
    totalCostBasis: 0,
    totalCurrentValue: 0,
    totalGain: 0,
    totalGainPct: 0,
  });
  const queryClient = useQueryClient();

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
    const details: SecurityDetail[] = (portfolio.securities ?? []).map((sec) => {
      const q = symbolQuoteMap[sec.symbol];
      const currentPrice = q?.price ?? 0;
      const costBasis = sec.purchasePrice * sec.quantity;
      const currentValue = currentPrice * sec.quantity;
      const totalGain = currentValue - costBasis;
      const totalGainPct = costBasis > 0 ? (totalGain / costBasis) * 100 : 0;
      return {
        symbol: sec.symbol.toUpperCase(),
        name: q?.name ?? "",
        quantity: sec.quantity,
        purchasePrice: sec.purchasePrice,
        purchaseDate: sec.purchaseDate,
        currentPrice,
        costBasis,
        currentValue,
        totalGain,
        totalGainPct,
        dayChange: (q?.priceChange ?? 0) * sec.quantity,
        dayChangePct: q?.percentChange ?? 0,
      };
    });
    setSecurityDetails(details);

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

    const totalValue = transformedData.reduce(
      (value, security) => (value += security.price * (security.quantity ?? 0)),
      0
    );

    const totalCostBasis = details.reduce((s, d) => s + d.costBasis, 0);
    const totalCurrentValue = details.reduce((s, d) => s + d.currentValue, 0);
    const totalGain = totalCurrentValue - totalCostBasis;
    const totalGainPct = totalCostBasis > 0 ? (totalGain / totalCostBasis) * 100 : 0;

    setPortfolioPerformance({
      totalPriceChange: formattedTotalPriceChange,
      totalPercentChange: formattedOverallPercentChange,
      totalCostBasis,
      totalCurrentValue,
      totalGain,
      totalGainPct,
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

  const gainClass = (val: number) => (val > 0 ? "gain" : val < 0 ? "loss" : "");
  const gainLabel = (val: number) => (val > 0 ? "gain" : val < 0 ? "loss" : "");
  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
            <div className={`portfolio-day-${gainClass(portfolioPerformance.totalPriceChange)}`}>
              Day {gainLabel(portfolioPerformance.totalPriceChange)}
              <div className={`portfolio-day-change-${gainClass(portfolioPerformance.totalPriceChange)}`}>
                <div>${fmt(Math.abs(portfolioPerformance.totalPriceChange))}</div>
                <div>{portfolioPerformance.totalPercentChange}%</div>
              </div>
            </div>
            <div className={`total-${gainClass(portfolioPerformance.totalGain)}`}>
              Total {gainLabel(portfolioPerformance.totalGain)}
              <div className={`portfolio-total-change-${gainClass(portfolioPerformance.totalGain)}`}>
                <div>${fmt(Math.abs(portfolioPerformance.totalGain))}</div>
                <div>{portfolioPerformance.totalGainPct.toFixed(2)}%</div>
              </div>
            </div>
          </div>
          {portfolioPerformance.totalCostBasis > 0 && (
            <div className="portfolio-summary-row" style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary, #aaa)" }}>
              <div>Cost basis: ${fmt(portfolioPerformance.totalCostBasis)}</div>
              <div>Current value: ${fmt(portfolioPerformance.totalCurrentValue)}</div>
            </div>
          )}
        </div>
      </div>
      {/* Detailed securities table */}
      {securityDetails.length > 0 && (
        <div className="bottom-row">
          <table className="security-details-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th>Qty</th>
                <th>Avg Cost</th>
                <th>Purchase Date</th>
                <th>Price</th>
                <th>Day Chg</th>
                <th>Total Gain</th>
                <th>Total %</th>
              </tr>
            </thead>
            <tbody>
              {securityDetails.map((d) => (
                <tr key={d.symbol}>
                  <td className="security-symbol-cell">{d.symbol}</td>
                  <td>{d.name}</td>
                  <td>{d.quantity}</td>
                  <td>${fmt(d.purchasePrice)}</td>
                  <td>{d.purchaseDate || "—"}</td>
                  <td>${fmt(d.currentPrice)}</td>
                  <td className={gainClass(d.dayChange)}>
                    {d.dayChange >= 0 ? "+" : ""}${fmt(d.dayChange)} ({d.dayChangePct.toFixed(2)}%)
                  </td>
                  <td className={gainClass(d.totalGain)}>
                    {d.totalGain >= 0 ? "+" : ""}${fmt(d.totalGain)}
                  </td>
                  <td className={gainClass(d.totalGainPct)}>
                    {d.totalGainPct >= 0 ? "+" : ""}{d.totalGainPct.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PortfolioPerformance;
