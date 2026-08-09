import React, { useEffect, useState, useMemo } from "react";
import { Watchlist, WatchlistSecurity } from "../../types/types";
import { getBatchQuotes } from "../search/quoteUtils";
import { useQueryClient } from "@tanstack/react-query";
import { FaTimes, FaSortUp, FaSortDown, FaSort } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { AreaChart, Area, YAxis } from "recharts";
import { formatCurrency, formatPercent, formatPriceChange } from "../../utils/format";
import { displaySymbol, tickerHue } from "../../utils/ticker";
import { isQuoteResolved } from "../../utils/holdings";
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
  /**
   * False when the feed returned no usable quote (renamed or delisted ticker,
   * e.g. SQ -> XYZ). Previously these rendered as a real $0.00 security with a
   * blank name, indistinguishable from a worthless one.
   */
  resolved: boolean;
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
      const resolved = isQuoteResolved(q);
      return {
        symbol: symbol.toUpperCase(),
        name: q?.name ?? "",
        price: resolved ? q!.price : 0,
        priceChange: resolved ? (q?.priceChange ?? 0) : 0,
        percentChange: resolved
          ? parseFloat((q?.percentChange ?? 0).toFixed(2))
          : 0,
        resolved,
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
    const numericSort = sortField !== "symbol" && sortField !== "name";
    copy.sort((a, b) => {
      // Unpriced rows have no meaningful number to compare, so keep them at
      // the bottom instead of letting a placeholder 0 sort them to the top.
      if (numericSort && a.resolved !== b.resolved) return a.resolved ? -1 : 1;
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

  /**
   * Trend curve between the two points we actually know: yesterday's close
   * (back-derived from price and % change) and the current price.
   *
   * This previously layered sine waves and scripted dips on top, which read as
   * real intraday price action — it was invented. The intermediate path is
   * eased interpolation only, so nothing is asserted that the data doesn't
   * support. Wiring up true intraday series would need a per-symbol history
   * request, which the batch quote endpoint doesn't provide.
   */
  const genSparkline = (price: number, pctChange: number): { v: number }[] => {
    const points = 16;
    const prevClose = price / (1 + pctChange / 100);
    return Array.from({ length: points }, (_, i) => {
      const t = i / (points - 1);
      // smoothstep so the line reads as a curve rather than a bare diagonal
      const eased = t * t * (3 - 2 * t);
      return { v: prevClose + (price - prevClose) * eased };
    });
  };

  const handleClick = (symbol: string) => {
    navigate(`/quote/${symbol}`, { state: [false, symbol] });
  };

  // Today's up/down/flat split — a portfolio gets rich summary cards above
  // its table; a watchlist previously had nothing there at all.
  const movers = useMemo(() => {
    const priced = rows.filter((r) => r.resolved);
    return {
      up: priced.filter((r) => r.percentChange > 0).length,
      down: priced.filter((r) => r.percentChange < 0).length,
      flat: priced.filter((r) => r.percentChange === 0).length,
    };
  }, [rows]);

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
      <div className="watchlist-movers">
        <span>{rows.length} {rows.length === 1 ? "security" : "securities"}</span>
        <span className="watchlist-movers-dot" />
        <span className="gain">{movers.up} up</span>
        <span className="watchlist-movers-dot" />
        <span className="loss">{movers.down} down</span>
        {movers.flat > 0 && (
          <>
            <span className="watchlist-movers-dot" />
            <span>{movers.flat} unchanged</span>
          </>
        )}
      </div>
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
              <th title="Direction from yesterday's close to the current price">
                Trend
              </th>
              {onRemoveSecurity && <th></th>}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => (
              <tr key={row.symbol} className="perf-table-row" onClick={() => handleClick(row.symbol)} style={{ cursor: "pointer" }}>
                <td>
                  <span
                    className="perf-symbol-badge"
                    style={{ "--ticker-hue": tickerHue(row.symbol) } as React.CSSProperties}
                  >
                    {displaySymbol(row.symbol)}
                  </span>
                </td>
                <td className="perf-name-cell">
                  <span className="perf-name-text" title={row.name}>{row.name}</span>
                </td>
                {!row.resolved ? (
                  <td
                    className="num perf-unpriced"
                    colSpan={4}
                    title={`No quote available for ${row.symbol}. The ticker may have been renamed or delisted.`}
                  >
                    Price unavailable
                  </td>
                ) : (
                  <>
                <td className="num">{formatCurrency(row.price)}</td>
                <td className={`num ${gainClass(row.priceChange)}`}>
                  {formatPriceChange(row.priceChange)}
                </td>
                <td className={`num ${gainClass(row.percentChange)}`}>
                  {formatPercent(row.percentChange)}
                </td>
                <td className="sparkline-cell">
                  {(() => {
                    const isUp = row.percentChange >= 0;
                    const strokeColor = isUp ? "var(--positive, #34a853)" : "var(--negative, #ea4335)";
                    const gradId = `sg-${row.symbol}`;
                    return (
                      <AreaChart
                        width={100}
                        height={32}
                        data={genSparkline(row.price, row.percentChange)}
                        margin={{ top: 4, right: 2, bottom: 4, left: 2 }}
                      >
                        <defs>
                          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={strokeColor} stopOpacity={0.22} />
                            <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        {/* Recharts defaults the Y domain to start at zero, which
                            flattens a intraday move against a $300 price into a
                            straight line. Fit the axis to the series instead. */}
                        <YAxis hide domain={["dataMin", "dataMax"]} />
                        <Area
                          type="monotone"
                          dataKey="v"
                          stroke={strokeColor}
                          strokeWidth={1.5}
                          fill={`url(#${gradId})`}
                          dot={false}
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    );
                  })()}
                </td>
                  </>
                )}
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
