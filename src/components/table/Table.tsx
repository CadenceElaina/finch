import * as React from "react";
import { FaArrowUp, FaArrowDown, FaCheckCircle } from "react-icons/fa";
import "./Table.css";
import { IoMdAddCircleOutline } from "react-icons/io";
import { TableProps, AllowedFields } from "./types";
import { Link, useNavigate } from "react-router-dom";
import { useWatchlists } from "../../context/WatchlistContext";
import { useAuth } from "../../context/AuthContext";

const getRandomColor = (): string => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const getChangeStyle = (change: number): string => {
  if (change > 0) {
    return "positive";
  } else if (change < 0) {
    return "negative";
  } else {
    return "";
  }
};

const getPriceChangePrefix = (change: number): string => {
  return change !== 0 ? (change > 0 ? "+$" : "-$") : "";
};

const getPriceChangeColor = (change: number): string => {
  return change > 0 ? "#00ff00" : "rgb(217, 48, 37)";
};

const Table: React.FC<TableProps> = ({
  data,
  config,
  full,
  /*   icon, */
  onIconClick,
}) => {
  const { watchlists } = useWatchlists();
  const { user } = useAuth();
  const navigate = useNavigate();
  /*   console.log(data, config); */
  const handleClick = (symbol: string) => {
    const newState = [false, symbol];
    navigate(`/quote/${symbol}`, { state: newState });
  };
  const usersWatchlists = watchlists.filter((w) => w.author === user?.name);
  return (
    <ul className={`custom-list${full ? "-full" : ""}`}>
      {data.map((item, i) => (
        <li
          key={item.id}
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
                  style={{
                    backgroundColor: getRandomColor(),
                  }}
                >
                  {item.symbol}
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
                      style={{
                        backgroundColor: getRandomColor(),
                      }}
                    >
                      {item.symbol}
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
                  <div className="field-value">${item.price}</div>

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
                              <FaArrowUp
                                style={{
                                  color: getPriceChangeColor(
                                    item.percentChange
                                  ),
                                  marginRight: "5px",
                                }}
                              />
                            ) : (
                              <FaArrowDown
                                style={{
                                  color: getPriceChangeColor(
                                    item.percentChange
                                  ),
                                  marginRight: "5px",
                                }}
                              />
                            )}
                            <span
                              className={getChangeStyle(item.percentChange)}
                            >
                              {" "}
                              {item.percentChange < 0
                                ? item.percentChange.toString().split("-")
                                : item.percentChange}
                              %
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
                            style={{
                              backgroundColor: getRandomColor(),
                            }}
                            key={`please${item.symbol}${item.id}`}
                          >
                            {item[field]}
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
                            ${item.price}
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
                                      <React.Fragment
                                        key={`${item.priceChange}-${item.name}-lol`}
                                      >
                                        <FaArrowUp
                                          style={{
                                            color: getPriceChangeColor(
                                              item.percentChange
                                            ),
                                            marginRight: "5px",
                                          }}
                                        />
                                      </React.Fragment>
                                    ) : (
                                      <React.Fragment
                                        key={`${item.priceChange}-${item.name}-lol-please`}
                                      >
                                        <FaArrowDown
                                          style={{
                                            color: getPriceChangeColor(
                                              item.percentChange
                                            ),
                                            marginRight: "5px",
                                          }}
                                        />
                                      </React.Fragment>
                                    )}
                                    <span
                                      className={getChangeStyle(
                                        item.percentChange
                                      )}
                                    >
                                      {" "}
                                      {item.percentChange < 0
                                        ? item.percentChange
                                            .toString()
                                            .split("-")
                                        : item.percentChange}
                                      %
                                    </span>
                                  </React.Fragment>
                                )}
                              </div>
                            </div>
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
                              {getPriceChangePrefix(item.priceChange)}
                              {item.priceChange !== 0 && (
                                <React.Fragment
                                  key={`priceChange-${item.id}-${item.priceChange}-${item.name}`}
                                >
                                  {item.priceChange < 0
                                    ? item.priceChange.toString().split("-")
                                    : item.priceChange}
                                </React.Fragment>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </React.Fragment>
                )
            )}

            {user &&
            usersWatchlists.some(
              (watchlist) =>
                watchlist.securities?.some(
                  (s) => s.symbol?.toLowerCase() === item.symbol?.toLowerCase()
                ) ?? false
            ) ? (
              // Render check icon and show dropdown for existing watchlists
              <FaCheckCircle
                onClick={() => onIconClick && onIconClick(item.symbol)}
              />
            ) : (
              // Render add icon and show dropdown for user's watchlists
              <IoMdAddCircleOutline
                onClick={() => onIconClick && onIconClick(item.symbol)}
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
