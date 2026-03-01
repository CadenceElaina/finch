import React from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import { getBatchQuotes } from "../search/quoteUtils";
import { quoteType } from "../search/types";
import "./RelatedStocks.css";

/** Popular symbols to suggest — we pick 6 excluding the current quote */
const POPULAR = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "META",
  "JPM", "V", "WMT", "UNH", "HD",
];

interface RelatedStocksProps {
  currentSymbol: string;
}

const RelatedStocks: React.FC<RelatedStocksProps> = ({ currentSymbol }) => {
  const queryClient = useQueryClient();
  const upperSymbol = currentSymbol.toUpperCase().replace("^", "");

  const candidates = POPULAR.filter((s) => s !== upperSymbol).slice(0, 6);

  const { data: quotes } = useQuery({
    queryKey: ["relatedStocks", upperSymbol],
    queryFn: () => getBatchQuotes(queryClient, candidates),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });

  const entries = candidates
    .map((sym) => quotes?.[sym] ?? null)
    .filter(Boolean) as quoteType[];

  if (entries.length === 0) return null;

  return (
    <div className="related-stocks">
      <div className="related-stocks-heading" role="heading">
        You may be interested in
      </div>
      <div className="related-stocks-grid">
        {entries.map((q) => {
          const up = q.percentChange >= 0;
          return (
            <Link
              key={q.symbol}
              to={`/quote/${q.symbol.toUpperCase()}`}
              state={[false, q.symbol.toUpperCase()]}
              className="related-stock-card"
            >
              <div className="related-stock-symbol">
                {q.symbol.toUpperCase()}
              </div>
              <div className="related-stock-name">{q.name}</div>
              <div className="related-stock-price">${q.price.toFixed(2)}</div>
              <div
                className={`related-stock-change ${up ? "positive" : "negative"}`}
              >
                {up ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />}
                <span>{q.percentChange.toFixed(2)}%</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default RelatedStocks;
