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
  const symbolsUS = ["^DJI", "^GSPC", "^IXIC", "^RUT", "^VIX"];
  const symbolsEUR = ["^GDAXI", "^FTSE", " ^IBEX"];
  const symbolsASIA = ["^N225", "^HSI", "^BSESN"];
  const symbolsCUR = ["EURUSD=X", "JPY=X", "GBPUSD=X", "CAD=X"];
  const symbolsCRYPTO = ["BTC-USD", "ETH-USD", "BAT-USD"];
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
    let symbols;

    switch (currExchange) {
      case Exchange.US:
        symbols = symbolsUS;
        break;
      case Exchange.Europe:
        symbols = symbolsEUR;
        break;
      case Exchange.Asia:
        symbols = symbolsASIA;
        break;
      case Exchange.Currencies:
        symbols = symbolsCUR;
        break;
      case Exchange.Crypto:
        symbols = symbolsCRYPTO;
        break;
      default:
        symbols = symbolsUS;
    }
    //
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

    const fetchData = async () => {
      try {
        setFetchError(false);
        const apiResponse = await fetchSymbolQuotes();
        const formattedData = formatApiResponse(apiResponse, currExchange);
        const formattedDataForContext = transformQuotesToData(apiResponse);
        setSymbolQuotes(formattedData);
        updateIndexQuotesData(formattedDataForContext);
      } catch (err) {
        console.error("Error fetching market data:", err);
        setFetchError(true);
      }
    };

    fetchData();
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
