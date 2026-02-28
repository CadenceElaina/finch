import { useEffect, useState } from "react";
import Table from "../table/Table";
import "../../App.css";
import { Data, RowConfig } from "../table/types";
import { useWatchlists } from "../../context/WatchlistContext";
import { /* fetchQuoteWithRetry */ getQuote } from "../search/quoteUtils";
import { quoteType } from "../search/types";
import { useQueryClient } from "@tanstack/react-query";
import { usePortfolios } from "../../context/PortfoliosContext";
import { useAuth } from "../../context/AuthContext";
import { Skeleton, Typography } from "@mui/material";
import { PortfolioSymbols } from "../../types/types";

const Watchlist = () => {
  const { portfolios } = usePortfolios();
  const { watchlists } = useWatchlists();
  const { user } = useAuth();
  const auth = !!user;
  const [isLoading, setIsLoading] = useState(true);
  const [watchlistsAndPortfoliosQuotes, setWatchlistsAndPortfoliosQuotes] =
    useState<Data[]>([]);
  const portfolioSymbols: PortfolioSymbols = {};

  // Populate the object with symbols and quantities
  portfolios.forEach((portfolio) => {
    const symbolsWithQuantities =
      portfolio.securities?.reduce((acc, security) => {
        acc[security.symbol] = security.quantity;

        return acc;
      }, {} as { [symbol: string]: number }) || {};

    portfolioSymbols[portfolio.title] = symbolsWithQuantities;
  });

  const queryClient = useQueryClient();
  const [portfolioQuotes, setPortfolioQuotes] = useState<
    Record<
      string,
      Array<
        | {
            symbol: string;
            price: number;
            percentChange: number;
            priceChange: number;
            quantity: number;
          }
        | undefined
      >
    >
  >({});

  const [quoteCache, setQuoteCache] = useState<
    Record<string, quoteType | null>
  >({});
  const [watchlistQuotes, setWatchlistQuotes] = useState<
    Record<
      string,
      {
        symbol: string;
        price: number;
        percentChange: number;
        priceChange: number;
        quantity?: number;
      }[]
    >
  >({});
  const fetchPortfolioQuotes = async (portfolioTitle: string) => {
    const symbolsWithQuantities = portfolioSymbols[portfolioTitle];

    const quotePromises = Object.entries(symbolsWithQuantities).map(
      async ([symbol, quantity]) => {
        // Check the cache first
        const cachedQuote = quoteCache[symbol];

        if (cachedQuote) {
          return {
            symbol,
            name: cachedQuote?.name,
            price: cachedQuote?.price || 0,
            percentChange: cachedQuote?.percentChange || 0,
            priceChange: cachedQuote?.priceChange || 0,
            quantity,
          };
        } else {
          // If not in the cache, make an API call
          const quoteData = await getQuote(queryClient, symbol);

          // Update the cache
          setQuoteCache((prevCache) => ({
            ...prevCache,
            [symbol]: quoteData,
          }));

          let pc = 0;
          if (quoteData?.percentChange) {
            pc = quoteData.percentChange * 100;
          }

          return {
            symbol,
            name: quoteData?.name,
            price: quoteData?.price || 0,
            percentChange: pc || 0,
            priceChange: quoteCache[symbol]?.priceChange || 0,
            quantity,
          };
        }
      }
    );

    const quotes = await Promise.all(quotePromises);

    setPortfolioQuotes((prevQuotes) => ({
      ...prevQuotes,
      [portfolioTitle]: quotes,
    }));
  };

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        setIsLoading(true);
        await Promise.all(
          portfolios.map(async (portfolio) => {
            await fetchPortfolioQuotes(portfolio.title);
          })
        );
        // Fetch watchlist quotes
        await fetchWatchlistQuotes();
      } catch (error) {
        console.error("Error fetching quotes:", error);
      } finally {
        // Set loading to false once data is fetched (successful or not)
        setIsLoading(false);
      }
    };
    // Execute the fetchQuotes function
    if (auth) {
      fetchQuotes();
    }
  }, [portfolios]);

  const fetchWatchlistQuotes = async () => {
    const symbols: string[] = [];
    // Get all unique symbols from watchlists
    watchlists.forEach((watchlist) => {
      if (watchlist.securities) {
        watchlist.securities.forEach((security) => {
          symbols.push(security.symbol);
        });
      }
    });
    //  console.log(symbols);
    // Remove duplicate symbols
    const uniqueSymbols = [...new Set(symbols)];
    // console.log("uniqueSymbols", uniqueSymbols);
    // Check if the symbol is already in the portfolioQuotes
    const symbolsInPortfolios = Object.values(portfolioQuotes)
      .flat()
      .map((quote) => (quote ? quote.symbol : undefined))
      .filter((symbol) => symbol !== undefined) as string[];
    const symbolsToFetch = uniqueSymbols.filter(
      (symbol) => !symbolsInPortfolios.includes(symbol)
    );
    const quotesPromises = symbolsToFetch.map(async (symbol) => {
      const cachedQuote = queryClient.getQueryData(["quote", symbol]) as
        | quoteType
        | undefined;

      if (cachedQuote) {
        return {
          symbol,
          name: cachedQuote.name,
          price: cachedQuote.price ?? 0,
          percentChange: cachedQuote.percentChange ?? 0,
          priceChange: cachedQuote.priceChange ?? 0,
        };
      }

      // If not in the cache, make an API call
      const quoteData = await getQuote(queryClient, symbol);

      let pc = 0;
      if (quoteData?.percentChange) {
        pc = quoteData.percentChange * 100;
      }
      //  console.log(pc);
      //  console.log(symbol);
      return {
        symbol,
        name: quoteData?.name,
        price: quoteData?.price ?? 0,
        percentChange: pc ?? 0,
        priceChange: quoteData?.priceChange ?? 0,
      };
    });

    const quotes = await Promise.all(quotesPromises);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quotesMap: Record<string, any[]> = {};
    quotes.forEach((quote) => {
      if (quote) {
        const { symbol, ...rest } = quote;
        if (!quotesMap[symbol]) {
          quotesMap[symbol] = [];
        }
        quotesMap[symbol].push(rest);
      }
    });

    setWatchlistQuotes(quotesMap);
  };

  useEffect(() => {
    // Check if portfolioQuotes has been fetched
    if (Object.keys(portfolioQuotes).length > 0 && auth) {
      // Fetch watchlist quotes
      fetchWatchlistQuotes();
    }
  }, [portfolioQuotes]);

  const watchlistConfig: RowConfig = {
    fields: ["symbol", "name", "price", "percentChange", "priceChange"],
    removeIcon: true,
  };
  useEffect(() => {
    // Check if portfolioQuotes and watchlistQuotes have been fetched
    if (
      Object.keys(portfolioQuotes).length > 0 &&
      Object.keys(watchlistQuotes).length > 0
    ) {
      // Convert watchlistQuotes to the desired format
      const formattedWatchlistQuotes: {
        symbol: string;
        price: number;
        percentChange: number;
        priceChange: number;
        quantity: number;
      }[] = Object.entries(watchlistQuotes).flatMap(([_watchlistId, quotes]) =>
        quotes.map((quote) => ({
          symbol: quote.symbol,
          price: quote.price,
          percentChange: quote.percentChange,
          priceChange: quote.priceChange,
          quantity: quote.quantity || 0,
        }))
      );
      // Combine portfolioQuotes and formattedWatchlistQuotes into a single array
      const allQuotes = Object.values(portfolioQuotes)
        .flat()
        .filter((q): q is NonNullable<typeof q> => q !== undefined)
        .concat(formattedWatchlistQuotes);

      // Format percentChange to two decimal places
      const formattedQuotes = allQuotes.map((quote) => ({
        ...quote,
        percentChange: Number((quote?.percentChange || 0).toFixed(2)),
      }));

      // Sort the array based on percentChange in descending order
      const sortedQuotes = formattedQuotes.sort(
        (a, b) => b.percentChange - a.percentChange
      );
      // Take the top 5 securities or as many as available
      const topQuotesCount = Math.min(sortedQuotes.length, 5);
      const topQuotes = sortedQuotes.slice(0, topQuotesCount);

      // Update state with the top quotes
      setWatchlistsAndPortfoliosQuotes(topQuotes);
    }
  }, [portfolioQuotes, watchlistQuotes]);

  return (
    <>
      {auth && (
        <div className="table-container">
          <div role="heading" className="watchlist-heading">
            {isLoading ? (
              // Show heading skeleton while data is loading
              <Typography variant="h6">
                <Skeleton
                  variant="rectangular"
                  width={300}
                  height={50}
                  sx={{ bgcolor: "rgba(255, 255, 255, 0.1)" }}
                />
              </Typography>
            ) : (
              "Top movers in your lists"
            )}
          </div>
          {isLoading ? (
            // Show table skeleton while data is loading
            <Skeleton
              variant="rectangular"
              width={600}
              height={300}
              sx={{ bgcolor: "rgba(255, 255, 255, 0.1)" }}
            />
          ) : (
            <Table
              data={watchlistsAndPortfoliosQuotes || []}
              config={watchlistConfig}
              full={true}
              icon={true}
            />
          )}
        </div>
      )}
    </>
  );
};

export default Watchlist;
