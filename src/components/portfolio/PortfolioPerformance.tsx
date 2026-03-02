import React, { useEffect, useState, useMemo } from "react";
import { Portfolio, Security } from "../../types/types";
import {
  Data,
  transformQuotesToDataWithQuantities,
} from "../market-trends/utils";
import { getBatchQuotes } from "../search/quoteUtils";
import { useQueryClient } from "@tanstack/react-query";
import { portfolioStorage } from "../../services/storage";
import PortfolioChart from "../PortfolioChart";
import { FaSortUp, FaSortDown, FaSort, FaTimes, FaInfoCircle } from "react-icons/fa";
import { getBatchStockMetadata, StockMetadata } from "../../services/stockMetadata";
import { getEtfSectorBreakdowns } from "../../services/etfHoldings";
import type { EtfSectorBreakdown } from "../../services/etfHoldings";
import { xirr } from "../../utils/xirr";
import PortfolioAnalysis from "./PortfolioAnalysis";
import "./Portfolio.css";

interface PortfolioPerformanceProps {
  portfolio: Portfolio;
  onRemoveSecurity?: (symbol: string) => void;
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
  holdingPeriodDays: number;
  holdingPeriodReturn: number;
}

type PortfolioSortField = "symbol" | "name" | "quantity" | "purchasePrice" | "purchaseDate" | "currentPrice" | "dayChange" | "totalGain" | "totalGainPct" | "holdingPeriodReturn";
type SortDir = "asc" | "desc";

const PortfolioPerformance: React.FC<PortfolioPerformanceProps> = ({
  portfolio,
  onRemoveSecurity,
}) => {
  //const [symbols, setSymbols] = useState<string[]>([]);
  const [securityDetails, setSecurityDetails] = useState<SecurityDetail[]>([]);
  const [sortField, setSortField] = useState<PortfolioSortField>("symbol");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [portfolioPerformance, setPortfolioPerformance] = useState({
    totalPriceChange: 0,
    totalPercentChange: 0,
    totalCostBasis: 0,
    totalCurrentValue: 0,
    totalGain: 0,
    totalGainPct: 0,
  });
  const [spyDayChange, setSpyDayChange] = useState<{ pct: number; price: number } | null>(null);
  const [metadataMap, setMetadataMap] = useState<Record<string, StockMetadata>>({});
  const [etfSectors, setEtfSectors] = useState<Record<string, EtfSectorBreakdown>>({});
  const queryClient = useQueryClient();

  const handleSort = (field: PortfolioSortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sortedDetails = useMemo(() => {
    const copy = [...securityDetails];
    copy.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      const diff = (aVal as number) - (bVal as number);
      return sortDir === "asc" ? diff : -diff;
    });
    return copy;
  }, [securityDetails, sortField, sortDir]);

  const PSortIcon: React.FC<{ field: PortfolioSortField }> = ({ field }) => {
    if (sortField !== field)
      return <FaSort size={10} style={{ marginLeft: 4, opacity: 0.3 }} />;
    return sortDir === "asc" ? (
      <FaSortUp size={10} style={{ marginLeft: 4 }} />
    ) : (
      <FaSortDown size={10} style={{ marginLeft: 4 }} />
    );
  };

  const fetchQuotesForSymbols = async () => {
    const symbols = portfolio?.securities?.map((s: Security) => s.symbol);
    if (!symbols || symbols.length === 0) {
      return;
    }
    const symbolQuoteMap = await getBatchQuotes(queryClient, symbols);

    // Fetch SPY as benchmark (piggyback if SPY is already in holdings, else separate)
    try {
      const spyMap = symbolQuoteMap["SPY"] ? symbolQuoteMap : await getBatchQuotes(queryClient, ["SPY"]);
      const spy = spyMap["SPY"];
      if (spy) {
        setSpyDayChange({ pct: spy.percentChange ?? 0, price: spy.price ?? 0 });
      }
    } catch { /* non-critical */ }
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
      // Holding period return
      const purchaseMs = sec.purchaseDate ? new Date(sec.purchaseDate).getTime() : Date.now();
      const holdingPeriodDays = Math.max(1, Math.round((Date.now() - purchaseMs) / 86_400_000));
      const holdingPeriodReturn = costBasis > 0 ? (totalGain / costBasis) * 100 : 0;

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
        holdingPeriodDays,
        holdingPeriodReturn,
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

  // Build chart data: stored history + today's live value
  const updatedPortfolioValue = useMemo(() => {
    const stored = convertPortfolioValueToNumbers(portfolio?.portfolioValue || []);
    const currentVal = portfolioPerformance.totalCurrentValue;
    if (currentVal <= 0) return stored;
    const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });
    // If today is already in stored data, replace it with live value; otherwise append
    const withoutToday = stored.filter((e) => e.date !== today);
    withoutToday.push({ date: today, value: currentVal });
    // If there's only one point, add cost basis as a starting point for visual context
    if (withoutToday.length === 1 && portfolioPerformance.totalCostBasis > 0) {
      // Use earliest purchase date if available
      const dates = (portfolio?.securities ?? []).map((s) => s.purchaseDate).filter(Boolean).sort();
      const startDate = dates.length > 0
        ? new Date(dates[0]).toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" })
        : today;
      if (startDate !== today) {
        withoutToday.unshift({ date: startDate, value: portfolioPerformance.totalCostBasis });
      }
    }
    return withoutToday;
  }, [portfolio?.portfolioValue, portfolioPerformance.totalCurrentValue, portfolioPerformance.totalCostBasis]);

  const gainClass = (val: number) => (val > 0 ? "gain" : val < 0 ? "loss" : "");
  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtPct = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatDuration = (days: number): string => {
    if (days < 31) return `${days}d`;
    if (days < 365) { const m = Math.floor(days / 30.44); return `${m}mo`; }
    const y = (days / 365.25); return y >= 10 ? `${Math.round(y)}y` : `${y.toFixed(1)}y`;
  };

  // ── Fetch stock metadata for portfolio analysis ──
  const symbolsKey = useMemo(
    () => securityDetails.map((d) => d.symbol).sort().join(","),
    [securityDetails]
  );

  useEffect(() => {
    if (!symbolsKey) return;
    const syms = symbolsKey.split(",");
    getBatchStockMetadata(syms).then((meta) => {
      setMetadataMap(meta);
      // Fetch ETF sector breakdowns for any ETF symbols
      const etfSyms = syms.filter(
        (s) => meta[s]?.quoteType?.toUpperCase() === "ETF"
      );
      if (etfSyms.length > 0) {
        getEtfSectorBreakdowns(etfSyms).then(setEtfSectors);
      }
    });
  }, [symbolsKey]);

  // ── XIRR (annualized money-weighted return) ──
  const xirrReturn = useMemo(() => {
    if (
      securityDetails.length === 0 ||
      portfolioPerformance.totalCurrentValue <= 0
    )
      return null;
    const flows = securityDetails.map((d) => ({
      date: new Date(d.purchaseDate),
      amount: -(d.purchasePrice * d.quantity),
    }));
    flows.push({
      date: new Date(),
      amount: portfolioPerformance.totalCurrentValue,
    });
    flows.sort((a, b) => a.date.getTime() - b.date.getTime());
    return xirr(flows);
  }, [securityDetails, portfolioPerformance.totalCurrentValue]);

  // ── Build holdings with metadata for analysis component ──
  const holdingsWithMeta = useMemo(() => {
    return securityDetails
      .filter((d) => metadataMap[d.symbol])
      .map((d) => ({
        symbol: d.symbol,
        currentValue: d.currentValue,
        quantity: d.quantity,
        metadata: metadataMap[d.symbol],
      }));
  }, [securityDetails, metadataMap]);

  return (
    <div className="perf">
      {/* ── Highlights row ── */}
      <div className="perf-highlights">
        <div className="perf-value-card">
          <span className="perf-value-label">Current Value</span>
          <span className="perf-value-amount">${fmt(portfolioPerformance.totalCurrentValue)}</span>
          {portfolioPerformance.totalCostBasis > 0 && (
            <span className="perf-value-cost">Cost basis: ${fmt(portfolioPerformance.totalCostBasis)}</span>
          )}
        </div>
        <div className={`perf-change-card ${gainClass(portfolioPerformance.totalGain)}`}>
          <span className="perf-change-label">Total Return</span>
          <span className="perf-change-num">
            {portfolioPerformance.totalGain >= 0 ? "+" : ""}${fmt(Math.abs(portfolioPerformance.totalGain))}
          </span>
          <span className="perf-change-pct">
            {portfolioPerformance.totalGainPct >= 0 ? "+" : ""}{fmtPct(portfolioPerformance.totalGainPct)}%
          </span>
        </div>
        <div className={`perf-change-card ${gainClass(portfolioPerformance.totalPriceChange)}`}>
          <span className="perf-change-label">Today</span>
          <span className="perf-change-num">
            {portfolioPerformance.totalPriceChange >= 0 ? "+" : ""}${fmt(Math.abs(portfolioPerformance.totalPriceChange))}
          </span>
          <span className="perf-change-pct">
            {portfolioPerformance.totalPercentChange >= 0 ? "+" : ""}{fmtPct(portfolioPerformance.totalPercentChange)}%
          </span>
        </div>
        {spyDayChange && (
          <div className="perf-benchmark-card">
            <span className="perf-change-label">S&amp;P 500 Today</span>
            <span className={`perf-change-num ${spyDayChange.pct >= 0 ? "gain" : "loss"}`}>
              {spyDayChange.pct >= 0 ? "+" : ""}{fmtPct(spyDayChange.pct)}%
            </span>
          </div>
        )}
        {xirrReturn !== null && (
          <div className={`perf-change-card ${gainClass(xirrReturn)}`}>
            <span className="perf-change-label">Annualized</span>
            <span className="perf-change-num">
              {xirrReturn >= 0 ? "+" : ""}{fmtPct(xirrReturn * 100)}%
            </span>
            <span className="perf-change-pct perf-xirr-label">
              XIRR
              <span className="perf-xirr-info">
                <FaInfoCircle />
                <span className="perf-xirr-tooltip">
                  XIRR (Extended Internal Rate of Return) is the annualized
                  return that accounts for the timing and size of each
                  contribution. Unlike simple return, it measures how
                  efficiently your money grew over time.
                </span>
              </span>
            </span>
          </div>
        )}
      </div>

      {/* ── Performance chart ── */}
      {updatedPortfolioValue.length >= 1 && (
        <div className="perf-chart-section">
          <h3 className="perf-section-title">Performance</h3>
          <PortfolioChart chartName={portfolio.title ?? ""} data={updatedPortfolioValue} />
        </div>
      )}

      {/* ── Portfolio Analysis (allocation + risk) ── */}
      {holdingsWithMeta.length > 0 && (
        <PortfolioAnalysis
          holdings={holdingsWithMeta}
          totalValue={portfolioPerformance.totalCurrentValue}
          etfSectors={etfSectors}
        />
      )}

      {/* ── Investments table ── */}
      {securityDetails.length > 0 && (
        <div className="perf-table-wrap">
          <h3 className="perf-section-title">Investments</h3>
          <table className="perf-table">
            <thead>
              <tr>
                <th className="sortable-th" onClick={() => handleSort("symbol")}>Symbol <PSortIcon field="symbol" /></th>
                <th className="sortable-th" onClick={() => handleSort("name")}>Name <PSortIcon field="name" /></th>
                <th className="sortable-th num" onClick={() => handleSort("quantity")}>Qty <PSortIcon field="quantity" /></th>
                <th className="sortable-th num" onClick={() => handleSort("purchasePrice")}>Avg Cost <PSortIcon field="purchasePrice" /></th>
                <th className="sortable-th num" onClick={() => handleSort("currentPrice")}>Price <PSortIcon field="currentPrice" /></th>
                <th className="sortable-th num" onClick={() => handleSort("dayChange")}>Today <PSortIcon field="dayChange" /></th>
                <th className="sortable-th num" onClick={() => handleSort("totalGain")}>Total <PSortIcon field="totalGain" /></th>
                <th className="sortable-th num" onClick={() => handleSort("totalGainPct")}>Return <PSortIcon field="totalGainPct" /></th>
                {onRemoveSecurity && <th></th>}
              </tr>
            </thead>
            <tbody>
              {sortedDetails.map((d) => (
                <tr key={d.symbol} className="perf-table-row">
                  <td>
                    <span className="perf-symbol-badge">{d.symbol}</span>
                  </td>
                  <td className="perf-name-cell">{d.name}</td>
                  <td className="num">{d.quantity}</td>
                  <td className="num">${fmt(d.purchasePrice)}</td>
                  <td className="num">${fmt(d.currentPrice)}</td>
                  <td className={`num ${gainClass(d.dayChange)}`}>
                    {d.dayChange >= 0 ? "+" : ""}${fmt(Math.abs(d.dayChange))}
                    <span className="perf-sub-pct">{d.dayChangePct >= 0 ? "+" : ""}{fmtPct(d.dayChangePct)}%</span>
                  </td>
                  <td className={`num ${gainClass(d.totalGain)}`}>
                    {d.totalGain >= 0 ? "+" : ""}${fmt(Math.abs(d.totalGain))}
                  </td>
                  <td className={`num ${gainClass(d.totalGainPct)}`}>
                    {d.totalGainPct >= 0 ? "+" : ""}{fmtPct(d.totalGainPct)}%
                    <span className="perf-sub-pct" title={`${d.holdingPeriodDays} days held`}>{formatDuration(d.holdingPeriodDays)}</span>
                  </td>
                  {onRemoveSecurity && (
                    <td>
                      <button className="perf-remove-btn" title={`Remove ${d.symbol}`} onClick={() => onRemoveSecurity(d.symbol.toLowerCase())}>
                        <FaTimes size={12} />
                      </button>
                    </td>
                  )}
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
