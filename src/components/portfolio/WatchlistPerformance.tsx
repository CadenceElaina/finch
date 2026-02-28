import React, { useEffect, useState } from "react";
import { Watchlist, WatchlistSecurity } from "../../types/types";
import Table from "../table/Table";
import { RowConfig } from "../table/types";
import { Data } from "../market-trends/utils";
import { getBatchQuotes } from "../search/quoteUtils";
import { useQueryClient } from "@tanstack/react-query";
import { FaTimes } from "react-icons/fa";
import "./Portfolio.css";

interface WatchlistPerformanceProps {
  watchlist: Watchlist;
  onRemoveSecurity?: (symbol: WatchlistSecurity) => void;
}

const WatchlistPerformance: React.FC<WatchlistPerformanceProps> = ({
  watchlist,
  onRemoveSecurity,
}) => {
  const [quotes, setQuotes] = useState<Data[]>([]);
  const queryClient = useQueryClient();

  const watchlistConfig: RowConfig = {
    fields: ["symbol", "name", "price", "priceChange", "percentChange"],
  };

  const fetchQuotes = async () => {
    const symbols =
      watchlist.securities?.map((s: WatchlistSecurity) => s.symbol) ?? [];
    if (symbols.length === 0) {
      setQuotes([]);
      return;
    }
    const symbolQuoteMap = await getBatchQuotes(queryClient, symbols);
    const data: Data[] = symbols.map((symbol, i) => {
      const q = symbolQuoteMap[symbol];
      return {
        id: i + 1,
        symbol: symbol.toUpperCase(),
        name: q?.name ?? "",
        price: q?.price ?? 0,
        priceChange: q?.priceChange ?? 0,
        percentChange: parseFloat((q?.percentChange ?? 0).toFixed(2)),
      };
    });
    setQuotes(data);
  };

  useEffect(() => {
    fetchQuotes();
  }, [watchlist]);

  return (
    <div className="portfolio-performance-container">
      {quotes.length > 0 ? (
        <div className="bottom-row">
          <div className="portfolio-performance-list">
            <Table
              data={quotes}
              config={watchlistConfig}
              full={true}
              icon={false}
            />
          </div>
          {onRemoveSecurity && (
            <div className="securities-list" style={{ marginTop: "0.5rem" }}>
              {watchlist.securities?.map((s) => (
                <div key={s.symbol} className="security-row">
                  <span className="security-symbol">
                    {s.symbol.toUpperCase()}
                  </span>
                  <button
                    className="security-remove-btn"
                    title={`Remove ${s.symbol}`}
                    onClick={() => onRemoveSecurity(s)}
                  >
                    <FaTimes size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: "1rem", color: "var(--text-secondary, #999)" }}>
          No securities in this watchlist yet.
        </div>
      )}
    </div>
  );
};

export default WatchlistPerformance;
