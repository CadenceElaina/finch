import { useEffect, useMemo, useState } from "react";
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

const Markets = () => {
  const { updateIndexQuotesData } = useIndexQuotes();
  const queryClient = useQueryClient();
  const [symbolQuotes, setSymbolQuotes] = useState<IndexCard[]>([]);
  const [currExchange, setCurrExchange] = useState(Exchange.US);
  const [fetchError, setFetchError] = useState(false);
  const { newsData } = useNews();

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
  }, [currExchange]);

  return (
    <>
      <div className="markets-container">
        <div className="compare-markets">Compare Markets</div>
        <div className="exchange-chips">
          {Object.values(Exchange).map((exchangeType) => (
            <div
              key={exchangeType}
              className={`chip ${
                currExchange === exchangeType ? "active" : ""
              }`}
              onClick={() => setCurrExchange(exchangeType)}
            >
              {exchangeType}
            </div>
          ))}
        </div>
        <div className="markets-article">
          {spotlightArticle && (
            <>
              <div className="markets-article-link">
                <a
                  href={spotlightArticle.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="linkToArticle"
                >
                  {spotlightArticle.title}
                </a>
              </div>
              <div className="markets-article-source">
                {spotlightArticle.source}{" "}
                {spotlightArticle.time}
              </div>
            </>
          )}
        </div>
      </div>

      <IndexCards cards={symbolQuotes} currExchange={currExchange} hasError={fetchError} />
    </>
  );
};

export default Markets;
