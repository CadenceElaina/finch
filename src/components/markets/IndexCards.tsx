import React from "react";
import { IndexCardProps, IndexCard, Exchange } from "./types";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";
import { Link } from "react-router-dom";
import ErrorState from "../ErrorState";

/** Format a number with commas and fixed decimals (e.g. 43,840.91) */
const fmt = (v: number, decimals = 2): string =>
  v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/** Signed percent string: "+0.37%" or "-1.05%" */
const fmtPct = (v: number): string => `${v > 0 ? "+" : ""}${fmt(v)}%`;

/** Signed price-change string: "159.95" or "-521.28" (with commas) */
const fmtChg = (v: number): string => fmt(v);

const IndexCards: React.FC<IndexCardProps> = ({ cards, currExchange, hasError }) => {
  const isIndex = true;
  const filteredCards = cards.filter((card: IndexCard) => card.exchange === currExchange);

  // Error state
  if (hasError) {
    return (
      <div className="index-cards-inner">
        <ErrorState
          message="Unable to load market data."
          onRetry={() => window.location.reload()}
          compact
        />
      </div>
    );
  }

  // Loading skeleton when no cards yet
  if (filteredCards.length === 0) {
    return (
      <div className="index-cards-inner">
        {Array.from({ length: currExchange === "Currencies" ? 4 : 5 }).map((_, i) => (
          <div key={i} className="index-card-skeleton">
            <div className="skeleton-bar sm" />
            <div className="skeleton-bar lg" />
            <div className="skeleton-bar md" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="index-cards-inner">
      {filteredCards
        .map((card: IndexCard) => {
          // Create a variable for the symbol
          let symbol = card.symbol;
          if (symbol.charAt(0) === "^") {
            symbol = symbol.replace("^", "");
          }
          // Check if the current exchange is Exchange.Currencies
          if (currExchange === Exchange.Currencies) {
            return (
              <div className="index-card-content currencies" key={card.symbol}>
                <div className="index-card-icon">
                  {card.priceChange > 0 ? (
                    <FaArrowUp style={{ color: "var(--positive)" }} />
                  ) : card.priceChange === 0 ? (
                    <></>
                  ) : (
                    <FaArrowDown style={{ color: "var(--negative)" }} />
                  )}
                </div>
                <div className="index-card-name-price">
                  <div className="index-card-name">{card.name}</div>
                  <div className="index-card-price">{fmt(card.price, 4)}</div>
                </div>
                <div className="index-card-change">
                  <div
                    className={`index-card-percent-change ${
                      card.percentChange > 0
                        ? "positive"
                        : card.percentChange === 0
                        ? ""
                        : "negative"
                    }`}
                  >
                    {fmtPct(card.percentChange)}
                  </div>
                  <div
                    className={`index-card-price-change ${
                      card.priceChange > 0
                        ? "positive"
                        : card.priceChange === 0
                        ? ""
                        : "negative"
                    }`}
                  >
                    <div>{fmtChg(card.priceChange)}</div>
                  </div>
                </div>
              </div>
            );
          }

          // If the current exchange is not Exchange.Currencies, render with Link
          return (
            <Link
              to={`/quote/${symbol}`}
              state={[isIndex, card.symbol]}
              className="index-card-link"
              key={card.symbol}
            >
              <div className="index-card-content">
                <div className="index-card-icon">
                  {card.priceChange > 0 ? (
                    <FaArrowUp style={{ color: "var(--positive)" }} />
                  ) : card.priceChange === 0 ? (
                    <></>
                  ) : (
                    <FaArrowDown style={{ color: "var(--negative)" }} />
                  )}
                </div>
                <div className="index-card-name-price">
                  <div className="index-card-name">{card.name}</div>
                  <div className="index-card-price">{fmt(card.price)}</div>
                </div>
                <div className="index-card-change">
                  <div
                    className={`index-card-percent-change ${
                      card.percentChange > 0
                        ? "positive"
                        : card.percentChange === 0
                        ? ""
                        : "negative"
                    }`}
                  >
                    {fmtPct(card.percentChange)}
                  </div>
                  <div
                    className={`index-card-price-change ${
                      card.priceChange > 0
                        ? "positive"
                        : card.priceChange === 0
                        ? ""
                        : "negative"
                    }`}
                  >
                    <div>{fmtChg(card.priceChange)}</div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
    </div>
  );
};

export default IndexCards;
