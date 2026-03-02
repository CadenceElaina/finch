import React, { useEffect, useState, useMemo } from "react";
import { Watchlist, WatchlistSecurity } from "../../types/types";
import { getBatchQuotes } from "../search/quoteUtils";
import { useQueryClient } from "@tanstack/react-query";
import { FaTimes, FaSortUp, FaSortDown, FaSort } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { LineChart, Line } from "recharts";
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
    const points = 16;
    const data: { v: number }[] = [];
    const prevClose = price / (1 + pctChange / 100);
    const range = Math.abs(price - prevClose) || price * 0.005;
    // Seed from price for deterministic but varied look
    const seed = (price * 137.03) % 100;
    for (let i = 0; i < points; i++) {
      const t = i / (points - 1);
      const base = prevClose + (price - prevClose) * t;
      // Two sine waves at different frequencies for organic feel
      const w1 = Math.sin(i * 1.9 + seed * 0.37) * range * 0.55;
      const w2 = Math.sin(i * 3.4 + seed * 0.13) * range * 0.3;
      // Small dip/spike at 1/3 and 2/3 through
      const w3 = (i === Math.floor(points * 0.33) ? -range * 0.4 : 0)
               + (i === Math.floor(points * 0.66) ? range * 0.35 : 0);
      data.push({ v: base + w1 + w2 + w3 });
    }
    return data;
  };

  const handleClick = (symbol: string) => {
    navigate(`/quote/${symbol}`, { state: [false, symbol] });
  };

  if (rows.length === 0) {
    return (
      <div className="lists-empty-holdings" style={{ marginTop: "1rem" }}>
        <p className="lists-empty-title">No securities in this watchlist yet</p>
        <p className="lists-empty-sub">Add symbols to track their price, change, and trends</p>
      </div>
    );
  }

  return (
    <div className="perf">
      <div className="perf-table-wrap">
        <table className="perf-table">
          <thead>
            <tr>
              <th className="sortable-th" onClick={() => handleSort("symbol")}>
                Symbol <SortIcon field="symbol" />
              </th>
              <th className="sortable-th" onClick={() => handleSort("name")}>
                Name <SortIcon field="name" />
              </th>
              <th className="sortable-th num" onClick={() => handleSort("price")}>
                Price <SortIcon field="price" />
              </th>
              <th className="sortable-th num" onClick={() => handleSort("priceChange")}>
                Change <SortIcon field="priceChange" />
              </th>
              <th className="sortable-th num" onClick={() => handleSort("percentChange")}>
                % Change <SortIcon field="percentChange" />
              </th>
              <th>Chart</th>
              {onRemoveSecurity && <th></th>}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => (
              <tr key={row.symbol} className="perf-table-row" onClick={() => handleClick(row.symbol)} style={{ cursor: "pointer" }}>
                <td>
                  <span className="perf-symbol-badge">{row.symbol}</span>
                </td>
                <td className="perf-name-cell">{row.name}</td>
                <td className="num">${fmt(row.price)}</td>
                <td className={`num ${gainClass(row.priceChange)}`}>
                  {row.priceChange >= 0 ? "+" : ""}${fmt(Math.abs(row.priceChange))}
                </td>
                <td className={`num ${gainClass(row.percentChange)}`}>
                  {row.percentChange >= 0 ? "+" : ""}{row.percentChange}%
                </td>
                <td className="sparkline-cell">
                  <LineChart width={80} height={32} data={genSparkline(row.price, row.percentChange)}>
                    <Line
                      type="monotone"
                      dataKey="v"
                      stroke={row.percentChange >= 0 ? "var(--positive, #34a853)" : "var(--negative, #ea4335)"}
                      strokeWidth={1.5}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </td>
                {onRemoveSecurity && (
                  <td>
                    <button
                      className="perf-remove-btn"
                      title={`Remove ${row.symbol}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveSecurity({ symbol: row.symbol.toLowerCase() });
                      }}
                    >
                      <FaTimes size={12} />
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
