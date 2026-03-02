import React from "react";
import { IndexCardProps, IndexCard, Exchange } from "./types";
import { Link } from "react-router-dom";
import ErrorState from "../ErrorState";

/** Format a number with commas and fixed decimals (e.g. 43,840.91) */
const fmt = (v: number, decimals = 2): string =>
  v.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

/** Signed percent string: "+0.37%" or "-1.05%" */
const fmtPct = (v: number): string => `${v > 0 ? "+" : ""}${fmt(v)}%`;

/** Signed price-change string: "+159.95" or "-521.28" */
const fmtChg = (v: number): string => `${v > 0 ? "+" : ""}${fmt(v)}`;

/** Determine color class from a number */
const colorCls = (v: number): string =>
  v > 0 ? "positive" : v < 0 ? "negative" : "";

/** Render the inner card body (shared between Link and plain div) */
const CardBody: React.FC<{ card: IndexCard; isCurrency?: boolean }> = ({
  card,
  isCurrency,
}) => {
  const cls = colorCls(card.percentChange);
  return (
    <div className={`idx-card ${cls}`}>
      <span className="idx-name">{card.name}</span>
      <span className="idx-price">
        {fmt(card.price, isCurrency ? 4 : 2)}
      </span>
      <span className={`idx-change ${cls}`}>
        {fmtPct(card.percentChange)}{" "}
        <span className="idx-chg-abs">{fmtChg(card.priceChange)}</span>
      </span>
    </div>
  );
};

const IndexCards: React.FC<IndexCardProps> = ({
  cards,
  currExchange,
  hasError,
}) => {
  const filteredCards = cards.filter(
    (card: IndexCard) => card.exchange === currExchange
  );

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

  if (filteredCards.length === 0) {
    return (
      <div className="index-cards-inner">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="idx-card-skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className="index-cards-inner">
      {filteredCards.map((card) => {
        const symbol = card.symbol.replace(/^\^/, "");
        const isCurrency = currExchange === Exchange.Currencies;

        if (isCurrency) {
          return (
            <Link
              to={`/quote/${encodeURIComponent(card.symbol)}`}
              state={[false, card.symbol]}
              className="idx-card-wrap"
              key={card.symbol}
            >
              <CardBody card={card} isCurrency />
            </Link>
          );
        }

        // Crypto — link without ^ prefix
        const isCryptoCard = currExchange === Exchange.Crypto;
        const linkSymbol = isCryptoCard ? card.symbol : symbol;
        const isIndexCard = !isCryptoCard;

        return (
          <Link
            to={`/quote/${encodeURIComponent(linkSymbol)}`}
            state={[isIndexCard, card.symbol]}
            className="idx-card-wrap"
            key={card.symbol}
          >
            <CardBody card={card} />
          </Link>
        );
      })}
    </div>
  );
};

export default IndexCards;
