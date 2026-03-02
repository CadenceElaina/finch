import React, { useState, useEffect, useRef } from "react";
import "./search.css";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { quoteType, suggestionType, utils } from "./types";
import { useNavigate } from "react-router-dom";
import { ENDPOINTS, yhFetch } from "../../config/api";

const POPULAR_SEARCHES = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "MSFT", name: "Microsoft Corporation" },
  { symbol: "GOOGL", name: "Alphabet Inc." },
  { symbol: "AMZN", name: "Amazon.com, Inc." },
  { symbol: "TSLA", name: "Tesla, Inc." },
  { symbol: "NVDA", name: "NVIDIA Corporation" },
];

const RECENT_SEARCHES_KEY = "finch_recent_searches";
const MAX_RECENT = 5;

/** Load recent searches from localStorage */
const getRecentSearches = (): { symbol: string; name: string }[] => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
  } catch {
    return [];
  }
};

/** Save a search to recent history */
const saveRecentSearch = (symbol: string, name?: string) => {
  const upper = symbol.toUpperCase();
  const recent = getRecentSearches().filter(
    (r) => r.symbol.toUpperCase() !== upper
  );
  recent.unshift({ symbol: upper, name: name || upper });
  localStorage.setItem(
    RECENT_SEARCHES_KEY,
    JSON.stringify(recent.slice(0, MAX_RECENT))
  );
};

interface SearchProps {
  /** Compact mode for header bar (smaller, no Search button) */
  compact?: boolean;
  /** Callback after navigating to a quote */
  onNavigate?: () => void;
}

const Search: React.FC<SearchProps> = ({ compact = false, onNavigate }) => {
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  const [showDropdown, setShowDropdown] = useState(false);
  const [searchInput, setSearchInput] = React.useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const queryClient = useQueryClient();

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
      const response = await yhFetch(ENDPOINTS.search.path, {
        query: searchInput,
        region: "US",
      });

      const d = response.data;
      const results = d?.quotes ?? d?.body ?? d?.ResultSet?.Result ?? [];
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
    } catch {
      return [];
    }
  };

  const bestMatchesQuery = useQuery<suggestionType[], Error>({
    queryKey: ["matches", searchInput],
    queryFn: getAutocompleteBestMatches,
    staleTime: 1000 * 60 * 15,
    enabled: searchInput !== "" && !isTyping, //Only enable query when the user is not typing and searchInput is not empty
  });

  /** Batch-fetch quotes for autocomplete matches to show prices in dropdown */
  const getQuotesForMatches = async (): Promise<quoteType[]> => {
    await queryClient.refetchQueries({ queryKey: ["matches", searchInput] });
    const bestMatches =
      queryClient.getQueryData<suggestionType[]>(["matches", searchInput]) ?? [];

    if (bestMatches.length === 0) return [];

    const symbolsStr = utils.getSymbols(bestMatches).join(",");
    try {
      const response = await yhFetch(ENDPOINTS.batchQuotes.path, {
        region: "US",
        symbols: symbolsStr,
      });
      const data =
        response.data?.quoteResponse?.result ??
        response.data?.quoteSummary?.result ??
        [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const quotes = (Array.isArray(data) ? data : [data]).map((q: any) => {
        // Handle nested quoteSummary format (q.price.*) or flat format
        const p = q.price ?? q;
        return {
          symbol: (p.symbol ?? q.symbol ?? "").toLowerCase(),
          price: p.regularMarketPrice?.raw ?? p.regularMarketPrice ?? 0,
          name: p.shortName ?? p.longName ?? "",
          priceChange: Number((p.regularMarketChange?.raw ?? p.regularMarketChange ?? 0).toFixed(2)),
          percentChange: p.regularMarketChangePercent?.raw != null
            ? p.regularMarketChangePercent.raw * 100
            : p.regularMarketChangePercent ?? 0,
        };
      });

      return utils.checkCachedQuotesType(
        quotes.filter(
          (q) => q.symbol !== "" || q.name !== "" || q.price !== 0
        )
      );
    } catch {
      return [];
    }
  };

  const quoteQuery = useQuery<quoteType[], Error>({
    queryKey: ["quote", searchInput],
    queryFn: getQuotesForMatches,
    staleTime: 1000 * 60 * 15,
    enabled: !isTyping && searchInput !== "",
  });

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
    setActiveIndex(-1);
  };

  const handleClick = () => {
    if (searchInput.trim() !== "") {
      // Navigate directly to the quote page
      handleClickQuote(searchInput.trim());
    }
  };

  //If enter is pressed while search-input is focused we get quote for current input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowDropdown(false);
      setActiveIndex(-1);
      return;
    }

    // Collect all visible result symbols for arrow-key navigation
    const allResults = getVisibleResults();

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setShowDropdown(true);
      setActiveIndex((prev) => Math.min(prev + 1, allResults.length - 1));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      // If an option is highlighted via arrow keys, navigate to it
      if (activeIndex >= 0 && allResults[activeIndex]) {
        handleClickQuote(allResults[activeIndex]);
        return;
      }
      // Navigate directly to the quote page for whatever the user typed
      if (searchInput.trim() !== "") {
        handleClickQuote(searchInput.trim());
      }
    }
  };

  /** Returns an ordered list of symbols currently visible in the dropdown. */
  const getVisibleResults = (): string[] => {
    // When input is empty, show recent + popular
    if (searchInput.trim() === "") {
      const recent = getRecentSearches().map((r) => r.symbol);
      const recentSet = new Set(recent);
      const popular = POPULAR_SEARCHES
        .filter((p) => !recentSet.has(p.symbol))
        .map((p) => p.symbol);
      return [...recent, ...popular];
    }
    if (quoteQuery.data && quoteQuery.data.length >= 1) {
      return quoteQuery.data.map((q) => q.symbol);
    }
    if (bestMatchesQuery.data) {
      return bestMatchesQuery.data.map((r) => r.symbol);
    }
    return [];
  };

  const handleClickQuote = (quote: string) => {
    // Save to recent searches
    const matchData = bestMatchesQuery.data?.find(
      (m) => m.symbol.toLowerCase() === quote.toLowerCase()
    );
    saveRecentSearch(quote, matchData?.name);

    // Clear search state so dropdown doesn't persist on navigation
    localStorage.removeItem("searchState");
    setShowDropdown(false);
    setSearchInput("");
    navigate(`/quote/${quote}`, { state: [false, quote] });
    onNavigate?.();
  };

  /** Render popular/recent suggestions when input is empty */
  const renderEmptyStateSuggestions = () => {
    const recent = getRecentSearches();
    const recentSymbols = new Set(recent.map((r) => r.symbol));
    const filteredPopular = POPULAR_SEARCHES.filter(
      (p) => !recentSymbols.has(p.symbol)
    );

    return (
      <div className="result-container" role="listbox" id="search-listbox">
        {recent.length > 0 && (
          <>
            <div className="search-section-label">Recent searches</div>
            {recent.map((item, i) => (
              <div
                key={`recent-${item.symbol}`}
                id={`search-option-${i}`}
                role="option"
                tabIndex={-1}
                aria-selected={i === activeIndex}
                className={`quote-row suggestion-row${i === activeIndex ? " active" : ""}`}
                onClick={() => handleClickQuote(item.symbol)}
              >
                <div className="left-column">
                  <div className="stock-name">{item.symbol}</div>
                  <div className="stock-details">{item.name}</div>
                </div>
              </div>
            ))}
          </>
        )}
        {filteredPopular.length > 0 && (
          <>
            <div className="search-section-label">Popular</div>
            {filteredPopular.map((item, i) => {
              const idx = recent.length + i;
              return (
                <div
                  key={`popular-${item.symbol}`}
                  id={`search-option-${idx}`}
                  role="option"
                  tabIndex={-1}
                  aria-selected={idx === activeIndex}
                  className={`quote-row suggestion-row${idx === activeIndex ? " active" : ""}`}
                  onClick={() => handleClickQuote(item.symbol)}
                >
                  <div className="left-column">
                    <div className="stock-name">{item.symbol}</div>
                    <div className="stock-details">{item.name}</div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    );
  };

  const renderQuoteResults = () => {
    // If input is empty, show recent + popular suggestions
    if (searchInput.trim() === "") {
      return renderEmptyStateSuggestions();
    }

    let optionIndex = 0;

    const renderRow = (
      quote: quoteType,
      matches: suggestionType[] | undefined
    ) => {
      const currentIndex = optionIndex++;
      return (
        <div
          key={quote.symbol}
          id={`search-option-${currentIndex}`}
          role="option"
          tabIndex={-1}
          aria-selected={currentIndex === activeIndex}
          className={`quote-row${currentIndex === activeIndex ? " active" : ""}`}
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
    };

    if (quoteQuery.data && quoteQuery.data.length === 1) {
      // Display single result
      const result = quoteQuery.data[0];

      return (
        <div
          className="result-container"
          role="listbox"
          id="search-listbox"
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
        <div className="result-container" role="listbox" id="search-listbox">
          {quoteQuery.data.map((quote) =>
            renderRow(quote, bestMatchesQuery.data)
          )}
        </div>
      );
    } else if (bestMatchesQuery.data) {
      // Display bestMatchesQuery results
      return (
        <div className="result-container" role="listbox" id="search-listbox">
          {bestMatchesQuery.data.map((result) => {
            const currentIndex = optionIndex++;
            return (
              <div
                key={result.symbol}
                id={`search-option-${currentIndex}`}
                role="option"
                tabIndex={-1}
                aria-selected={currentIndex === activeIndex}
                className={`quote-row${currentIndex === activeIndex ? " active" : ""}`}
                onClick={() => handleClickQuote(result.symbol)}
              >
                <div className="left-column">
                  <div className="stock-name">{result.name}</div>
                  <div className="stock-details">{`${result.symbol} : ${result.region}`}</div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Show "no results" when search completed but nothing found
    if (searchInput.trim().length > 0 && !bestMatchesQuery.isLoading && !quoteQuery.isLoading) {
      return (
        <div className="result-container">
          <div className="no-results">No results found for "{searchInput}"</div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <div className={`app-container${compact ? " compact" : ""}`} role="search">
        <div className="search-container" ref={inputRef}>
          <input
            className="search-input"
            value={searchInput}
            onChange={handleChange}
            onClick={handleInputClick}
            onKeyDown={handleKeyDown}
            placeholder="Search for stocks..."
            role="combobox"
            aria-label="Search for stocks"
            aria-expanded={showDropdown}
            aria-autocomplete="list"
            aria-controls={showDropdown ? "search-listbox" : undefined}
            aria-activedescendant={
              activeIndex >= 0 ? `search-option-${activeIndex}` : undefined
            }
            autoComplete="off"
            autoFocus={compact}
          />
          {!compact && (
            <button
              className="search-button"
              onClick={handleClick}
              aria-label="Search"
            >
              Search
            </button>
          )}
          {showDropdown && (
            <div className="data" ref={dropdownRef}>
              {renderQuoteResults()}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Search;
