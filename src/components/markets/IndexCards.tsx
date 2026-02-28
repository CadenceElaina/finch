import React from "react";
import { IndexCardProps, IndexCard, Exchange } from "./types";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";
import { Link } from "react-router-dom";

const IndexCards: React.FC<IndexCardProps> = ({ cards, currExchange }) => {
  const isIndex = true;

  return (
    <div className="index-cards-inner">
      {cards
        .filter((card: IndexCard) => card.exchange === currExchange)
        .map((card: IndexCard) => {
          // Create a variable for the symbol
          let symbol = card.symbol;
          if (symbol.charAt(0) === "^") {
            symbol = symbol.replace("^", "");
          }
          /*           console.log("Current Exchange:", currExchange); */
          // Check if the current exchange is Exchange.Currencies
          if (currExchange === Exchange.Currencies) {
            return (
              <div className="index-card-content currencies" key={card.symbol}>
                <div className="index-card-icon">
                  {card.priceChange > 0 ? (
                    <FaArrowUp style={{ color: "green" }} />
                  ) : card.priceChange === 0 ? (
                    <></>
                  ) : (
                    <FaArrowDown style={{ color: "red" }} />
                  )}
                </div>
                <div className="index-card-name-price">
                  <div className="index-card-name">{card.name}</div>
                  <div className="index-card-price">{card.price}</div>
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
                    {card.percentChange > 0
                      ? "+"
                      : card.percentChange === 0
                      ? ""
                      : "-"}
                    {card.percentChange}%
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
                    <div>{card.priceChange}</div>
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
                    <FaArrowUp style={{ color: "green" }} />
                  ) : card.priceChange === 0 ? (
                    <></>
                  ) : (
                    <FaArrowDown style={{ color: "red" }} />
                  )}
                </div>
                <div className="index-card-name-price">
                  <div className="index-card-name">{card.name}</div>
                  <div className="index-card-price">{card.price}</div>
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
                    {card.percentChange > 0
                      ? "+"
                      : card.percentChange === 0
                      ? ""
                      : "-"}
                    {card.percentChange}%
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
                    <div>{card.priceChange}</div>
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
