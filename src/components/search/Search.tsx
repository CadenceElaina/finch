import React, { useState, useEffect, useRef } from "react";
import "./search.css";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { quoteType, suggestionType, utils } from "./types";
import { useNavigate } from "react-router-dom";
import { YH_API_HOST, YH_API_KEY, ENDPOINTS } from "../../config/api";

const BASE = `https://${YH_API_HOST}`;
const headers = () => ({
  "X-RapidAPI-Key": YH_API_KEY,
  "X-RapidAPI-Host": YH_API_HOST,
});

const Search = () => {
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  const [showDropdown, setShowDropdown] = useState(false);
  const [searchInput, setSearchInput] = React.useState<string>("");
  const [searchedQuote, setSearchedQuote] = React.useState("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [fetchDataClicked, setFetchDataClicked] =
    React.useState<boolean>(false);

  const queryClient = useQueryClient(); // Step 2

  queryClient.setQueryDefaults(["quote"], { gcTime: 1000 * 60 * 15 });

  const getAutocompleteBestMatches = async (): Promise<suggestionType[]> => {
    // Try to get cached data
    if (searchInput.length <= 1) {
      return [];
    }
    const cachedData = queryClient.getQueryData(["matches", searchInput]);

    if (cachedData) {
      // If cached data is available, return it
      const checkedCachedData = utils.checkCachedSuggestionType(cachedData);
      return checkedCachedData;
    }

    try {
      const response = await axios.get(
        `${BASE}${ENDPOINTS.search.path}`,
        { params: { q: searchInput, region: "US" }, headers: headers() }
      );

      const results = response.data?.quotes ?? response.data?.body ?? [];
      const matches: suggestionType[] = results
        .slice(0, 5)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((item: any) => ({
          symbol: item.symbol ?? "",
          name: item.shortname ?? item.longname ?? item.name ?? "",
          type: item.typeDisp ?? item.quoteType ?? item.type ?? "",
          region: item.exchDisp ?? item.exchange ?? item.exch ?? "",
          currency: "USD",
        }));

      // Update the query cache with the new data
      queryClient.setQueryData(["matches", searchInput], matches);

      return matches;
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  const bestMatchesQuery = useQuery<suggestionType[], Error>({
    queryKey: ["matches", searchInput],
    queryFn: getAutocompleteBestMatches,
    staleTime: 1000 * 60 * 15,
    enabled: searchInput !== "" && !isTyping, //Only enable query when the user is not typing and searchInput is not empty
  });

  const getQuote = async (): Promise<quoteType[]> => {
    if (fetchDataClicked) {
      try {
        const cachedQuote = queryClient.getQueryData(["quote", searchInput]);
        if (cachedQuote) {
          const newCachedQuote = utils.checkCachedQuoteType(cachedQuote);
          return [newCachedQuote];
        }
        const response = await axios.get(
          `${BASE}${ENDPOINTS.batchQuotes.path}`,
          { params: { region: "US", symbols: searchInput }, headers: headers() }
        );

        const q = response.data?.quoteResponse?.result?.[0];
        if (!q) throw new Error("Incomplete or missing data in the API response");

        const quoteData: quoteType = {
          symbol: (q.symbol ?? searchInput).toLowerCase(),
          price: q.regularMarketPrice ?? 0,
          name: q.shortName ?? "",
          priceChange: Number((q.regularMarketChange ?? 0).toFixed(2)),
          percentChange: q.regularMarketChangePercent ?? 0,
        };
        return [quoteData];
      } catch (error) {
        console.error(error);
        throw new Error("Failed to fetch quote data");
      }
    } else {
      // if we do not click the button we should fetch data for each item in bestMatchesQuery.data to display in the dropdown
      await queryClient.refetchQueries({ queryKey: ["matches", searchInput] });
      const bestMatches =
        queryClient.getQueryData<suggestionType[]>(["matches", searchInput]) ??
        [];
      if (bestMatches !== undefined) {
        const matchesSymbols = utils.getSymbols(bestMatches);
        // Batch fetch quotes for all matched symbols in one call
        const symbolsStr = matchesSymbols.join(",");
        const quotePromises = [async () => {
          try {
            const response = await axios.get(
              `${BASE}${ENDPOINTS.batchQuotes.path}`,
              { params: { region: "US", symbols: symbolsStr }, headers: headers() }
            );
            const data = response.data?.quoteResponse?.result ?? [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (Array.isArray(data) ? data : [data]).map((q: any) => ({
              symbol: (q.symbol ?? "").toLowerCase(),
              price: q.regularMarketPrice ?? 0,
              name: q.shortName ?? "",
              priceChange: Number((q.regularMarketChange ?? 0).toFixed(2)),
              percentChange: q.regularMarketChangePercent ?? 0,
            }));
          } catch {
            return [];
          }
        }];

        // Wait for batch call to complete
        const batchResults = await Promise.all(quotePromises.map(fn => fn()));
        const quotes = batchResults.flat();
        // Filter out potential null and empty values
        const validNonEmptyQuotes = quotes.filter(
          (quote) =>
            quote !== null &&
            (quote.symbol !== "" ||
              quote.name !== "" ||
              quote.price !== 0 ||
              quote.priceChange !== 0 ||
              quote.percentChange !== 0)
        );
        const validQuotesType =
          utils.checkCachedQuotesType(validNonEmptyQuotes);
        return validQuotesType;
      }

      try {
        return [
          {
            symbol: "",
            name: "",
            price: 0,
            priceChange: 0,
            percentChange: 0,
          },
        ];
      } catch (error) {
        console.error(error);
        throw new Error("Failed to fetch quote data");
      }
    }
  };

  const quoteQuery = useQuery<quoteType[], Error>({
    queryKey: ["quote", searchInput, searchedQuote],
    queryFn: getQuote,
    staleTime: 1000 * 60 * 15,
    enabled: fetchDataClicked || (!isTyping && searchInput !== ""), // Only enable the query when fetchDataClicked is true
  });

  // Handle onSuccess separately
  React.useEffect(() => {
    if (quoteQuery.isSuccess) {
      setFetchDataClicked(false);
    }
  }, [quoteQuery.isSuccess]);

  useEffect(() => {
    if (searchInput !== "") {
      // Clear the existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Set a new timeout to change isTyping to false after 3000 milliseconds (3 seconds)
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 1500);
    }
    // Cleanup function to clear the timeout if the component unmounts or if searchInput changes before the timeout
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [searchInput]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef, inputRef]);

  useEffect(() => {
    // Restore search input if returning from a quote page, but don't auto-open dropdown
    const savedState = JSON.parse(localStorage.getItem("searchState") || "{}");
    const savedSearchInput = savedState.searchInput || "";
    setSearchInput(savedSearchInput);
    setShowDropdown(false);
    localStorage.removeItem("searchState");
  }, []);

  const handleInputClick = () => {
    setShowDropdown(true);
  };

  const handleChange = (e: { target: { value: string } }) => {
    setIsTyping(true);
    setSearchInput(e.target.value.toLowerCase());
  };

  const handleClick = () => {
    if (searchInput.trim() !== "") {
      setSearchedQuote(searchInput);
      setFetchDataClicked(true);
      setShowDropdown(true);
      // Check if data is available in the cache
      const cachedQuote = queryClient.getQueryData(["quote", searchedQuote]);

      if (!cachedQuote && quoteQuery.isStale) {
        // If data is not in the cache or stale, trigger the query
        quoteQuery.refetch();
      }
    }
  };

  //If enter is pressed while search-input is focused we get quote for current input
  const handleKeyDown = (e: { key: string }) => {
    if (e.key === "Enter") {
      setSearchedQuote(searchInput);
      setFetchDataClicked(true);
      setShowDropdown(true);
      const cachedQuote = queryClient.getQueryData(["quote", searchedQuote]);

      if (!cachedQuote && quoteQuery.isStale) {
        // If data is not in the cache or stale, trigger the query
        quoteQuery.refetch();
      }
    }
  };

  const handleClickQuote = (quote: string) => {
    const newState = [false, quote];
    // Clear search state so dropdown doesn't persist on navigation
    localStorage.removeItem("searchState");
    setShowDropdown(false);
    setSearchInput("");
    //quote
    navigate(`quote/${quote}`, { state: newState });
  };

  const renderQuoteResults = () => {
    const renderRow = (
      quote: quoteType,
      matches: suggestionType[] | undefined
    ) => (
      <div
        key={quote.symbol}
        className="quote-row"
        onClick={() => handleClickQuote(quote.symbol)}
      >
        <div className="left-column">
          <div className="stock-name">{quote.name}</div>
          <div className="stock-details">{`${quote.symbol} :  ${
            matches ? matches[0]?.region : ""
          }`}</div>
        </div>
        <div className="right-column">
          <div className="price">{quote.price}</div>
          <div className="price-change">{`${quote.priceChange > 0 ? "+" : ""}${
            quote.priceChange
          }`}</div>
          <div className="percent-change">{`${
            quote.percentChange > 0 ? "+" : ""
          }${quote.percentChange}%`}</div>
        </div>
      </div>
    );

    if (quoteQuery.data && quoteQuery.data.length === 1) {
      // Display single result
      const result = quoteQuery.data[0];

      return (
        <div
          className="result-container"
          onClick={() => handleClickQuote(result.symbol)}
        >
          {renderRow(result, bestMatchesQuery.data)}
        </div>
      );
    } else if (
      bestMatchesQuery.data &&
      quoteQuery.data &&
      quoteQuery.data.length > 1
    ) {
      // Display multiple results
      return (
        <div className="result-container">
          {quoteQuery.data.map((quote) =>
            renderRow(quote, bestMatchesQuery.data)
          )}
        </div>
      );
    } else if (bestMatchesQuery.data) {
      // Display bestMatchesQuery results
      return (
        <div className="result-container">
          {bestMatchesQuery.data.map((result) => (
            <div
              key={result.symbol}
              className="quote-row"
              onClick={() => handleClickQuote(result.symbol)}
            >
              <div className="left-column">
                <div className="stock-name">{result.name}</div>
                <div className="stock-details">{`${result.symbol} : ${result.region}`}</div>
              </div>
              {/* You can decide if you want to display price, price change, percent change for best matches */}
            </div>
          ))}
        </div>
      );
    }

    return null; // Return null if there are no results
  };

  return (
    <>
      <div className="app-container">
        <div className="search-container" ref={inputRef}>
          <input
            className="search-input"
            value={searchInput}
            onChange={handleChange}
            onClick={handleInputClick}
            onKeyDown={handleKeyDown}
            placeholder="Search for stocks..."
          />
          <button className="search-button" onClick={handleClick}>
            Search
          </button>
        </div>
        {showDropdown && (
          <div className="data" ref={dropdownRef}>
            {renderQuoteResults()}
          </div>
        )}
      </div>
    </>
  );
};

export default Search;
