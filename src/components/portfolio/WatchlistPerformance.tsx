import React, { useEffect, useState, useMemo } from "react";
import { Watchlist, WatchlistSecurity } from "../../types/types";
import { getBatchQuotes } from "../search/quoteUtils";
import { useQueryClient } from "@tanstack/react-query";
import { FaTimes, FaSortUp, FaSortDown, FaSort } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import "./Portfolio.css";

interface WatchlistPerformanceProps {
  watchlist: Watchlist;
  onRemoveSecurity?: (symbol: WatchlistSecurity) => void;
}

interface WatchlistRow {
  symbol: string;
  name: string;
  price: number;
  priceChange: number;
  percentChange: number;
}

type SortField = "symbol" | "name" | "price" | "priceChange" | "percentChange";
type SortDir = "asc" | "desc";

const WatchlistPerformance: React.FC<WatchlistPerformanceProps> = ({
  watchlist,
  onRemoveSecurity,
}) => {
  const [rows, setRows] = useState<WatchlistRow[]>([]);
  const [sortField, setSortField] = useState<SortField>("symbol");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const fetchQuotes = async () => {
    const symbols =
      watchlist.securities?.map((s: WatchlistSecurity) => s.symbol) ?? [];
    if (symbols.length === 0) {
      setRows([]);
      return;
    }
    const symbolQuoteMap = await getBatchQuotes(queryClient, symbols);
    const data: WatchlistRow[] = symbols.map((symbol) => {
      const q = symbolQuoteMap[symbol];
      return {
        symbol: symbol.toUpperCase(),
        name: q?.name ?? "",
        price: q?.price ?? 0,
        priceChange: q?.priceChange ?? 0,
        percentChange: parseFloat((q?.percentChange ?? 0).toFixed(2)),
      };
    });
    setRows(data);
  };

  useEffect(() => {
    fetchQuotes();
  }, [watchlist]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      const diff = (aVal as number) - (bVal as number);
      return sortDir === "asc" ? diff : -diff;
    });
    return copy;
  }, [rows, sortField, sortDir]);

  const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
    if (sortField !== field)
      return <FaSort size={10} style={{ marginLeft: 4, opacity: 0.3 }} />;
    return sortDir === "asc" ? (
      <FaSortUp size={10} style={{ marginLeft: 4 }} />
    ) : (
      <FaSortDown size={10} style={{ marginLeft: 4 }} />
    );
  };

  const gainClass = (val: number) =>
    val > 0 ? "gain" : val < 0 ? "loss" : "";
  const fmt = (n: number) =>
    n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  /** Generate a deterministic mini sparkline from price + percentChange */
  const genSparkline = (price: number, pctChange: number): { v: number }[] => {
    const points = 12;
    const data: { v: number }[] = [];
    // Start from approximate previous close, end at current price
    const prevClose = price / (1 + pctChange / 100);
    for (let i = 0; i < points; i++) {
      const t = i / (points - 1);
      // Smooth interpolation with a little deterministic wobble
      const wobble = Math.sin(i * 2.1 + price * 0.01) * price * 0.003;
      data.push({ v: prevClose + (price - prevClose) * t + wobble });
    }
    return data;
  };

  const handleClick = (symbol: string) => {
    navigate(`/quote/${symbol}`, { state: [false, symbol] });
  };

  if (rows.length === 0) {
    return (
      <div className="empty-state" style={{ marginTop: "1rem" }}>
        <p className="empty-state-text">No securities in this watchlist yet</p>
        <p className="empty-state-subtext">Add symbols to track their price, change, and trends</p>
      </div>
    );
  }

  return (
    <div className="portfolio-performance-container">
      <div className="bottom-row">
        <table className="security-details-table">
          <thead>
            <tr>
              <th className="sortable-th" onClick={() => handleSort("symbol")}>
                Symbol <SortIcon field="symbol" />
              </th>
              <th className="sortable-th" onClick={() => handleSort("name")}>
                Name <SortIcon field="name" />
              </th>
              <th className="sortable-th" onClick={() => handleSort("price")}>
                Price <SortIcon field="price" />
              </th>
              <th className="sortable-th" onClick={() => handleSort("priceChange")}>
                Change <SortIcon field="priceChange" />
              </th>
              <th className="sortable-th" onClick={() => handleSort("percentChange")}>
                % Change <SortIcon field="percentChange" />
              </th>
              <th>Chart</th>
              {onRemoveSecurity && <th></th>}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => (
              <tr key={row.symbol}>
                <td
                  className="security-symbol-cell clickable-cell"
                  onClick={() => handleClick(row.symbol)}
                >
                  {row.symbol}
                </td>
                <td
                  className="clickable-cell"
                  onClick={() => handleClick(row.symbol)}
                >
                  {row.name}
                </td>
                <td>${fmt(row.price)}</td>
                <td className={gainClass(row.priceChange)}>
                  {row.priceChange >= 0 ? "+" : ""}${fmt(row.priceChange)}
                </td>
                <td className={gainClass(row.percentChange)}>
                  {row.percentChange >= 0 ? "+" : ""}
                  {row.percentChange}%
                </td>
                <td className="sparkline-cell">
                  <ResponsiveContainer width={80} height={30}>
                    <LineChart data={genSparkline(row.price, row.percentChange)}>
                      <Line
                        type="monotone"
                        dataKey="v"
                        stroke={row.percentChange >= 0 ? "#00c853" : "#e53935"}
                        strokeWidth={1.5}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </td>
                {onRemoveSecurity && (
                  <td>
                    <button
                      className="security-remove-btn"
                      title={`Remove ${row.symbol}`}
                      onClick={() =>
                        onRemoveSecurity({ symbol: row.symbol.toLowerCase() })
                      }
                    >
                      <FaTimes size={14} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WatchlistPerformance;
