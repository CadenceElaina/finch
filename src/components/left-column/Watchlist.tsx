import { useEffect, useState } from "react";
import Table from "../table/Table";
import "../../App.css";
import { Data, RowConfig } from "../table/types";
import { useWatchlists } from "../../context/WatchlistContext";
import { /* fetchQuoteWithRetry */ getBatchQuotes } from "../search/quoteUtils";
import { quoteType } from "../search/types";
import { useQueryClient } from "@tanstack/react-query";
import { usePortfolios } from "../../context/PortfoliosContext";
import { Skeleton, Typography } from "@mui/material";
import { PortfolioSymbols } from "../../types/types";

const Watchlist = () => {
  const { portfolios } = usePortfolios();
  const { watchlists } = useWatchlists();
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
    const allSymbols = Object.keys(symbolsWithQuantities);

    const batchResult = await getBatchQuotes(queryClient, allSymbols);

    const quotes = allSymbols.map((symbol) => {
      const quoteData = batchResult[symbol] ?? quoteCache[symbol];
      const quantity = symbolsWithQuantities[symbol];

      // Update the cache
      if (quoteData && !quoteCache[symbol]) {
        setQuoteCache((prevCache) => ({
          ...prevCache,
          [symbol]: quoteData,
        }));
      }

      let pc = 0;
      if (quoteData?.percentChange) {
        pc = quoteData.percentChange;
      }

      return {
        symbol,
        name: quoteData?.name,
        price: quoteData?.price || 0,
        percentChange: pc || 0,
        priceChange: quoteData?.priceChange || 0,
        quantity,
      };
    });

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
    fetchQuotes();
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
    // Remove duplicate symbols
    const uniqueSymbols = [...new Set(symbols)];
    // Check if the symbol is already in the portfolioQuotes
    const symbolsInPortfolios = Object.values(portfolioQuotes)
      .flat()
      .map((quote) => (quote ? quote.symbol : undefined))
      .filter((symbol) => symbol !== undefined) as string[];
    const symbolsToFetch = uniqueSymbols.filter(
      (symbol) => !symbolsInPortfolios.includes(symbol)
    );
    const batchResult = await getBatchQuotes(queryClient, symbolsToFetch);

    const quotes = symbolsToFetch.map((symbol) => {
      const quoteData = batchResult[symbol] ?? null;

      let pc = 0;
      if (quoteData?.percentChange) {
        pc = quoteData.percentChange;
      }
      return {
        symbol,
        name: quoteData?.name,
        price: quoteData?.price ?? 0,
        percentChange: pc ?? 0,
        priceChange: quoteData?.priceChange ?? 0,
      };
    });

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
    if (Object.keys(portfolioQuotes).length > 0) {
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
    </>
  );
};

export default Watchlist;
