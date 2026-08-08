import * as React from "react";
import { FaArrowUp, FaArrowDown, FaCheckCircle } from "react-icons/fa";
import "./Table.css";
import { IoMdAddCircleOutline } from "react-icons/io";
import { TableProps, AllowedFields } from "./types";
import Sparkline from "../quote-chart/Sparkline";
import { Link, useNavigate } from "react-router-dom";
import { useWatchlists } from "../../context/WatchlistContext";
import { usePortfolios } from "../../context/PortfoliosContext";
import { formatCurrency, formatPriceChange } from "../../utils/format";
import { displaySymbol, tickerHue } from "../../utils/ticker";

const getChangeStyle = (change: number): string => {
  if (change > 0) {
    return "positive";
  } else if (change < 0) {
    return "negative";
  } else {
    return "";
  }
};

/**
 * Badge style for a ticker. Only the hue is set here; CSS resolves the
 * background/text lightness per theme so contrast holds in light and dark.
 */
const tickerBadgeStyle = (symbol: string): React.CSSProperties =>
  ({ "--ticker-hue": tickerHue(symbol) } as React.CSSProperties);

const Table: React.FC<TableProps> = ({
  data,
  config,
  full,
  /*   icon, */
  onIconClick,
}) => {
  const { watchlists } = useWatchlists();
  const { portfolios } = usePortfolios();
  const navigate = useNavigate();
  const handleClick = (symbol: string) => {
    const newState = [false, symbol];
    navigate(`/quote/${symbol}`, { state: newState });
  };
  return (
    <ul className={`custom-list${full ? "-full" : ""}`}>
      {data.map((item, i) => (
        <li
          key={item.id ?? `${item.symbol}-${i}`}
          className={`list-item${
            config?.name === "most-followed" ? " mostfollowed" : ""
          } ${config?.name === "market-trends" ? "market-trends" : ""}`}
        >
          <div className="item-content">
            {config.name === "most-followed" &&
            item.symbol &&
            item.name &&
            item.followers ? (
              <div
                className="symbol-name-followers"
                key={`${item.id}-${item.symbol}-${item.name}-${item.followers}----${item.symbol}`}
                onClick={() => handleClick(item.symbol)}
              >
                <div
                  className="field-value-symbol"
                  style={tickerBadgeStyle(item.symbol)}
                >
                  {displaySymbol(item.symbol)}
                </div>
                <div className="field-value">{item.name}</div>
                <div className="field-value">{item.followers}</div>
              </div>
            ) : null}
            {config.name === "market-trends" && item.symbol && item.name && (
              <React.Fragment
                key={`frag-${item.id}-${item.symbol}-${item.name}---${item.symbol}`}
              >
                <div
                  className="symbol-name"
                  onClick={() => handleClick(item.symbol)}
                >
                  <div className={`item-field`}>
                    <div
                      className="field-value-symbol"
                      style={tickerBadgeStyle(item.symbol)}
                    >
                      {displaySymbol(item.symbol)}
                    </div>
                  </div>
                  <div
                    className={`item-field symbol`}
                    onClick={() => handleClick(item.symbol)}
                  >
                    <div className="field-value">{item.name}</div>
                  </div>
                </div>
                {item.article && (
                  <div className="article">
                    <Link
                      to={`${item.article?.title ? item.article.title : "/"}`}
                    >
                      {item.article?.title}
                    </Link>
                    <div>
                      {item.article?.source} • {item.article?.time}
                    </div>
                  </div>
                )}
                <div
                  className="price-pc"
                  onClick={() => handleClick(item.symbol)}
                >
                  <div className="field-value">{formatCurrency(item.price)}</div>

                  <div className={`item-field percent-change`}>
                    <div
                      className={`${getChangeStyle(
                        item.percentChange
                      )}-percent`}
                    >
                      <div className={`field-value percent-change`}>
                        {item.percentChange !== 0 && (
                          <React.Fragment
                            key={`percentChange-${item.id}-${item.percentChange}--${item.symbol}`}
                          >
                            {item.percentChange > 0 ? (
                              <FaArrowUp className="change-arrow" />
                            ) : (
                              <FaArrowDown className="change-arrow" />
                            )}
                            <span
                              className={getChangeStyle(item.percentChange)}
                            >
                              {Math.abs(item.percentChange).toFixed(2)}%
                            </span>
                          </React.Fragment>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            )}
            {(config.fields as AllowedFields[]).map(
              (field, j) =>
                config.fields.includes(field) && (
                  <React.Fragment
                    key={`This one needs to be unique key using loop${i}${item.id}${j}`}
                  >
                    {field !== "article" && config.name !== "market-trends" && (
                      <div
                        key={`k-${field}-${item.id}-l`}
                        className={`item-field ${field}`}
                        onClick={() => handleClick(item.symbol)}
                      >
                        {field === "symbol" && !config.name && (
                          <div
                            className="field-value-symbol"
                            style={tickerBadgeStyle(String(item[field]))}
                            key={`please${item.symbol}${item.id}`}
                          >
                            {displaySymbol(String(item[field]))}
                          </div>
                        )}
                        {field === "name" && !config.name && (
                          <div
                            className="field-value"
                            key={`Iwillremovethiswraning${item.symbol}`}
                            onClick={() => handleClick(item.symbol)}
                          >
                            {item.name}
                          </div>
                        )}

                        {field === "price" && (
                          <div
                            className="field-value"
                            key={`mustfixwarning${item.symbol}`}
                          >
                            {formatCurrency(item.price)}
                          </div>
                        )}
                        {field === "percentChange" && (
                          <div
                            className={`item-field percent-change`}
                            key={`we hate warning errors ${item.id}-${item.name}`}
                            onClick={() => handleClick(item.symbol)}
                          >
                            <div
                              className={`${getChangeStyle(
                                item.percentChange
                              )}-percent`}
                            >
                              <div className={`field-value percent-change`}>
                                {item.percentChange !== 0 && (
                                  <React.Fragment
                                    key={`percentChange-${item.percentChange}`}
                                  >
                                    {item.percentChange > 0 ? (
                                      <FaArrowUp className="change-arrow" />
                                    ) : (
                                      <FaArrowDown className="change-arrow" />
                                    )}
                                    <span
                                      className={getChangeStyle(
                                        item.percentChange
                                      )}
                                    >
                                      {Math.abs(item.percentChange).toFixed(2)}%
                                    </span>
                                  </React.Fragment>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        {field === "sparkline" && (
                          <div
                            className="item-field sparkline"
                            key={`sparkline-${item.symbol}`}
                            onClick={() => handleClick(item.symbol)}
                          >
                            <Sparkline up={item.percentChange >= 0} seed={item.symbol} />
                          </div>
                        )}
                        {field === "priceChange" && (
                          <div
                            className={`item-field price-change`}
                            key={`item-field-price-change ${item.priceChange}`}
                            onClick={() => handleClick(item.symbol)}
                          >
                            <div
                              className={`field-value price-change ${getChangeStyle(
                                item.priceChange
                              )}`}
                            >
                              {formatPriceChange(item.priceChange)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </React.Fragment>
                )
            )}

            {watchlists.some(
              (watchlist) =>
                watchlist.securities?.some(
                  (s) => s.symbol?.toLowerCase() === item.symbol?.toLowerCase()
                ) ?? false
            ) || portfolios.some(
              (portfolio) =>
                portfolio.securities?.some(
                  (s) => s.symbol?.toLowerCase() === item.symbol?.toLowerCase()
                ) ?? false
            ) ? (
              // Render check icon and show dropdown for existing watchlists
              <FaCheckCircle
                onClick={() => onIconClick && onIconClick(item.symbol)}
                title="Remove from list"
                className="check-in-list"
              />
            ) : (
              // Render add icon and show dropdown for user's watchlists
              <IoMdAddCircleOutline
                onClick={() => onIconClick && onIconClick(item.symbol)}
                title="Add to list"
                size={24}
              />
            )}
          </div>
        </li>
      ))}
    </ul>
  );
};

export default Table;
