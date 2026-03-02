import { useEffect, useMemo, useRef, useState } from "react";
import { Exchange, IndexCard } from "./types";
import IndexCards from "./IndexCards";
import "./markets.css";
import { useNews } from "../../context/NewsContext";
import { getBatchQuotes } from "../search/quoteUtils";
import { quoteType } from "../search/types";
import { useQueryClient } from "@tanstack/react-query";
import { formatApiResponse } from "./marketsUtils";
import { transformQuotesToData } from "../market-trends/utils";
import { useIndexQuotes } from "../../context/IndexQuotesContext";
import { useSnapshot } from "../../context/SnapshotContext";
import { extractIndicesFromSnapshot } from "../../services/marketSnapshot";

/**
 * Symbol maps matching Google Finance market tabs.
 * US: S&P 500, Dow, Nasdaq, Russell 2000, VIX
 * Europe: DAX, FTSE 100, CAC 40, IBEX 35, STOXX 50
 * Asia: Nikkei 225, SSE, HSI, SENSEX, NIFTY 50
 * Crypto: Bitcoin, Ethereum, Solana, XRP, Dogecoin
 * Currencies: EUR/USD, JPY/USD, GBP/USD, CAD/USD, AUD/USD
 */
const MARKET_SYMBOLS: Record<Exchange, string[]> = {
  [Exchange.US]: ["^GSPC", "^DJI", "^IXIC", "^RUT", "^VIX"],
  [Exchange.Europe]: ["^GDAXI", "^FTSE", "^FCHI", "^IBEX", "^STOXX50E"],
  [Exchange.Asia]: ["^N225", "000001.SS", "^HSI", "^BSESN", "^NSEI"],
  [Exchange.Crypto]: ["BTC-USD", "ETH-USD", "SOL-USD", "XRP-USD", "DOGE-USD"],
  [Exchange.Currencies]: ["EURUSD=X", "JPY=X", "GBPUSD=X", "CAD=X", "AUDUSD=X"],
};

const Markets = () => {
  const { updateIndexQuotesData } = useIndexQuotes();
  const queryClient = useQueryClient();
  const [symbolQuotes, setSymbolQuotes] = useState<IndexCard[]>([]);
  const [currExchange, setCurrExchange] = useState(Exchange.US);
  const [fetchError, setFetchError] = useState(false);
  const { newsData } = useNews();
  const { snapshot, isStale } = useSnapshot();
  const snapshotApplied = useRef(false);

  // Pick a stable random article (only changes when newsData array changes)
  const spotlightArticle = useMemo(() => {
    if (!newsData.length) return null;
    return newsData[Math.floor(Math.random() * newsData.length)];
  }, [newsData.length]);

  queryClient.setQueryDefaults(["quote"], { gcTime: 1000 * 60 * 15 });

  // ── Use KV snapshot for US indices if available ────────
  useEffect(() => {
    if (
      currExchange === Exchange.US &&
      snapshot?.indices &&
      !snapshotApplied.current
    ) {
      const indicesMap = extractIndicesFromSnapshot(snapshot);
      if (Object.keys(indicesMap).length > 0) {
        const formattedData = formatApiResponse(indicesMap, Exchange.US);
        const formattedDataForContext = transformQuotesToData(indicesMap);
        setSymbolQuotes(formattedData);
        updateIndexQuotesData(formattedDataForContext);
        snapshotApplied.current = true;

        // If snapshot is stale, still do a live fetch in the background
        if (!isStale) return;
      }
    }
  }, [snapshot, currExchange]);

  const fetchSymbolQuotes = async () => {
    const symbols = MARKET_SYMBOLS[currExchange] ?? MARKET_SYMBOLS[Exchange.US];

    const batchResult = await getBatchQuotes(queryClient, symbols);

    const symbolQuoteMap: Record<string, quoteType | null> = {};
    symbols.forEach((symbol) => {
      symbolQuoteMap[symbol] = batchResult[symbol] ?? null;
    });

    return symbolQuoteMap;
  };

  useEffect(() => {
    // Skip live fetch for US if snapshot was fresh
    if (
      currExchange === Exchange.US &&
      snapshotApplied.current &&
      !isStale
    ) {
      return;
    }

    let stale = false;

    const fetchData = async () => {
      try {
        setFetchError(false);
        const apiResponse = await fetchSymbolQuotes();
        if (stale) return; // component re-rendered, discard old result
        const formattedData = formatApiResponse(apiResponse, currExchange);
        // Only update state if we got at least one valid quote
        if (formattedData.length === 0) return;
        const formattedDataForContext = transformQuotesToData(apiResponse);
        setSymbolQuotes(formattedData);
        updateIndexQuotesData(formattedDataForContext);
      } catch (err) {
        if (stale) return;
        console.error("Error fetching market data:", err);
        setFetchError(true);
      }
    };

    fetchData();
    return () => { stale = true; };
  }, [currExchange, isStale]);

  return (
    <>
      <div className="markets-container">
        <div className="markets-top-bar">
          <span className="compare-markets-label">Compare Markets</span>
          <div className="exchange-chips">
            {Object.values(Exchange).map((exchangeType) => (
              <span
                key={exchangeType}
                className={`chip ${
                  currExchange === exchangeType ? "active" : ""
                }`}
                onClick={() => setCurrExchange(exchangeType)}
              >
                {exchangeType}
              </span>
            ))}
          </div>
          <div className="markets-article">
            {spotlightArticle && (
              <>
                <a
                  href={spotlightArticle.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="markets-article-link"
                >
                  {spotlightArticle.title}
                </a>
                <span className="markets-article-source">
                  {spotlightArticle.source}{" "}
                  {spotlightArticle.time}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <IndexCards cards={symbolQuotes} currExchange={currExchange} hasError={fetchError} />
    </>
  );
};

export default Markets;
