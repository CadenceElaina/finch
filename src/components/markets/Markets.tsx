import { useEffect, useState } from "react";
import { Exchange, IndexCard } from "./types";
import IndexCards from "./IndexCards";
import "./markets.css";
import { Link } from "react-router-dom";
import { useNews } from "../../context/NewsContext";
import { getQuote } from "../search/quoteUtils";
import { quoteType, utils } from "../search/types";
import { useQueryClient } from "@tanstack/react-query";
import { formatApiResponse } from "./marketsUtils";
import { transformQuotesToData } from "../market-trends/utils";
import { useIndexQuotes } from "../../context/IndexQuotesContext";

const Markets = () => {
  const { updateIndexQuotesData } = useIndexQuotes();
  const queryClient = useQueryClient();
  const [symbolQuotes, setSymbolQuotes] = useState<IndexCard[]>([]);
  const [currExchange, setCurrExchange] = useState(Exchange.US);
  const newsData = useNews();
  // Generate 9 random articles
  const numRandomArticles = 1;
  const randomIndexes = Array.from(
    { length: Math.min(numRandomArticles, newsData.length) },
    () => Math.floor(Math.random() * newsData.length)
  );
  // Get the selected random articles from newsData
  const randomArticles = randomIndexes.map((index) => newsData[index]);
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
    const quotePromises = symbols.map(async (symbol) => {
      // Check the cache first
      const cachedQuote = queryClient.getQueryData(["quote", symbol]);

      if (cachedQuote) {
        const newCachedQuote = utils.checkCachedQuoteType(cachedQuote);
        return newCachedQuote;
      }

      const quoteData = await getQuote(queryClient, symbol);
      await new Promise((resolve) => setTimeout(resolve, 200)); // 200ms delay
      // Update the cache
      queryClient.setQueryData(["quote", symbol], quoteData);

      return quoteData;
    });

    const quotes = await Promise.all(quotePromises);

    const symbolQuoteMap: Record<string, quoteType | null> = {};
    symbols.forEach((symbol, index) => {
      if (quotes[index] !== null) {
        symbolQuoteMap[symbol] = quotes[index] as quoteType;
      }
    });

    return symbolQuoteMap;
  };

  useEffect(() => {
    const fetchData = async () => {
      const apiResponse = await fetchSymbolQuotes();
      const formattedData = formatApiResponse(apiResponse, currExchange);
      const formattedDataForContext = transformQuotesToData(apiResponse);
      setSymbolQuotes(formattedData);
      updateIndexQuotesData(formattedDataForContext);
    };

    fetchData();
  }, [currExchange]);

  return (
    <>
      <div className="markets-container">
        <div className="compare-markets">Compare Markets - </div>
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
        </div>{" "}
        <div className="markets-article">
          <div className="markets-article-link">
            <Link
              to={`${randomArticles[0]?.link ?? ""}`}
              className="linkToArticle"
            >
              {`${randomArticles[0]?.title ?? ""}`}
            </Link>
          </div>
          <div className="markets-article-source">
            {`${randomArticles[0]?.source ?? ""}`}{" "}
            {`${randomArticles[0]?.time ?? ""}`}
          </div>
        </div>
      </div>

      <IndexCards cards={symbolQuotes} currExchange={currExchange} />
    </>
  );
};

export default Markets;
