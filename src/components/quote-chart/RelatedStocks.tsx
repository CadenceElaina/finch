import React from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import { getBatchQuotes } from "../search/quoteUtils";
import { quoteType } from "../search/types";
import ScrollRow from "./ScrollRow";
import { getPeerSymbols, getMarketCategory } from "../../data/instrumentInfo";
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

  // Use peer symbols from the same market category if available, otherwise popular stocks
  const peerSymbols = getPeerSymbols(currentSymbol);
  const hasPeers = peerSymbols.length > 0;
  const candidates = hasPeers
    ? peerSymbols
    : POPULAR.filter((s) => s !== upperSymbol).slice(0, 6);

  // For peer instruments, we need to determine if they are indexes for nav state
  const peerCategory = getMarketCategory(currentSymbol);

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
        {hasPeers ? "Compare to" : "You may be interested in"}
      </div>
      <ScrollRow className="related-stocks-grid">
        {entries.map((q) => {
          const up = q.percentChange >= 0;
          const displaySymbol = q.symbol.toUpperCase().replace("^", "");
          // Determine if this peer is an index/instrument for navigation
          const isInstrumentPeer = hasPeers && (peerCategory === "US" || peerCategory === "Europe" || peerCategory === "Asia");
          const navState = isInstrumentPeer
            ? [true, q.symbol.toUpperCase()]
            : hasPeers
              ? [false, q.symbol.toUpperCase()]
              : [false, q.symbol.toUpperCase()];

          return (
            <Link
              key={q.symbol}
              to={`/quote/${displaySymbol}`}
              state={navState}
              className="related-stock-card"
            >
              <div className="related-stock-symbol">
                {q.name?.length > 20 ? q.name.slice(0, 18) + "…" : q.name || displaySymbol}
              </div>
              <div className="related-stock-name">{displaySymbol}</div>
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
      </ScrollRow>
    </div>
  );
};

export default RelatedStocks;
