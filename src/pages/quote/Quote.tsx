import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import QuoteChart from "../../components/quote-chart/QuoteChart";
import "./Quote.css";
import Footer from "../../components/Footer";
import {
  FaAngleDown,
  FaAngleRight,
  FaAngleUp,
  FaArrowDown,
  FaArrowUp,
  FaCheck,
} from "react-icons/fa";
import { IoAddSharp } from "react-icons/io5";
import QuoteNews from "../../components/quote-chart/news/QuoteNews";
import RelatedStocks from "../../components/quote-chart/RelatedStocks";
import AiPanel from "../../components/ai/AiPanel";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getQuotePageData } from "../../components/search/quoteUtils";
import { ENDPOINTS, getQuoteRefreshInterval } from "../../config/api";
import { isHoliday } from "./quoteUtils";
import { formatCurrency, formatPriceChange } from "../../utils/format";
import Skeleton from "@mui/material/Skeleton";
import ErrorState from "../../components/ErrorState";
import { useWatchlists } from "../../context/WatchlistContext";
import { useNotification } from "../../context/NotificationContext";

interface QuoteProps {
  symbol?: string;
  price?: number;
  data?: [];
}

const Quote: React.FC<QuoteProps> = () => {
  const [marketStatus, setMarketStatus] = useState<string>("Closed");
  const queryClient = useQueryClient();
  const location = useLocation();
  const { quote: urlParam } = useParams<{ quote: string }>();
  const { state } = location;
  const { watchlists, addSecurityToWatchlist } = useWatchlists();
  const { addNotification } = useNotification();

  const isIndex = state?.[0] ?? false;
  const symbol = state?.[1] ? `${state[1]}` : (urlParam ?? "");
  const symbolState = state?.[1] || (urlParam ?? "");

  const KNOWN_INDEXES = ["DJI", "GSPC", "IXIC", "RUT", "VIX", "GDAXI", "FTSE", "IBEX", "N225", "HSI", "BSEN"];
  const strippedSymbol = symbolState.replace("^", "");
  const detectedIndex = KNOWN_INDEXES.includes(strippedSymbol);
  const chartSymbol = detectedIndex
    ? (symbolState.startsWith("^") ? symbolState : `^${symbolState}`)
    : symbol;

  const [selectedInterval, setSelectedInterval] = useState("1D");
  const [isAboutOpen, setIsAboutOpen] = useState(true);
  const [isFinancialsOpen, setIsFinancialsOpen] = useState(false);

  /** Check if the symbol is already in any watchlist */
  const isFollowing = useMemo(() => {
    const upper = symbol.toUpperCase();
    return watchlists.some(
      (wl) => wl.securities?.some((s) => s.symbol.toUpperCase() === upper)
    );
  }, [watchlists, symbol]);

  const { data: quotePageData, isLoading, isError, refetch } = useQuery({
    queryKey: ["quotePageData", symbol],
    queryFn: () =>
      getQuotePageData(queryClient, symbol || "", state?.[0] || false),
    enabled: Boolean(symbol),
    staleTime: ENDPOINTS.profile.cache.stale,
    gcTime: ENDPOINTS.profile.cache.gc,
    refetchInterval: getQuoteRefreshInterval(),
    refetchIntervalInBackground: false,
  });

  const quoteData = quotePageData?.quoteData;
  const quoteSidebarData = quotePageData?.quoteSidebarData;
  const quoteSidebarAboutData = quotePageData?.quoteSidebarAboutData;
  const quoteFinancialData = quotePageData?.quoteFinancialData;

  const handleFollow = () => {
    if (isFollowing) return;
    const upper = symbol.toUpperCase();
    if (watchlists.length === 0) {
      addNotification("Create a watchlist first to follow stocks.", "info");
      return;
    }
    const target = watchlists[0];
    addSecurityToWatchlist(target.id, {
      symbol: upper,
      name: quoteData?.name || upper,
    });
    addNotification(`${upper} added to ${target.title}`, "success");
  };

  const handleIntervalChange = (interval: string) => {
    setSelectedInterval(interval);
  };

  useEffect(() => {
    const getCurrentTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const currentTimeInMinutes = hours * 60 + minutes;
      const marketOpen = 9 * 60 + 30;
      const marketClose = 16 * 60;
      const afterStart = 16 * 60 + 15;
      const afterEnd = 18 * 60 + 30;

      if (isHoliday(now)) {
        setMarketStatus("Closed - Holiday");
      } else if (currentTimeInMinutes >= marketOpen && currentTimeInMinutes < marketClose) {
        setMarketStatus("Regular Market Hours");
      } else if (currentTimeInMinutes >= afterStart && currentTimeInMinutes <= afterEnd) {
        setMarketStatus("After-Hours Trading");
      } else if (currentTimeInMinutes >= marketClose) {
        setMarketStatus("Closed");
      } else {
        setMarketStatus("Pre-Market");
      }
    };
    getCurrentTime();
    const id = setInterval(getCurrentTime, 3600000);
    return () => clearInterval(id);
  }, []);

  const sidebarEntries = [
    { label: "Previous Close", key: "previousClose" },
    { label: "Day Range", key: "dayRange" },
    { label: "52 Week Range", key: "fiftyTwoWeekRange" },
    { label: "Market Cap", key: "marketCap" },
    { label: "Volume", key: "volume" },
    { label: "Avg Volume", key: "average3MonthVolume" },
    { label: "P/E Ratio", key: "trailingPE" },
    { label: "Dividend Yield", key: "dividendYield" },
  ];

  // ── Loading ──
  if (isLoading && !quotePageData) {
    return (
      <Layout>
        <div className="quote-page">
          <div className="quote-header">
            <div className="quote-breadcrumb">
              <Link to="/">HOME</Link>
              <FaAngleRight className="quote-breadcrumb-sep" />
              <span>{symbol}</span>
            </div>
            <Skeleton variant="text" width={280} height={36} sx={{ bgcolor: "rgba(255,255,255,0.06)" }} />
          </div>
          <div className="quote-layout">
            <div className="quote-main">
              <Skeleton variant="text" width={180} height={48} sx={{ bgcolor: "rgba(255,255,255,0.06)" }} />
              <Skeleton variant="text" width={120} height={24} sx={{ bgcolor: "rgba(255,255,255,0.06)" }} />
              <Skeleton variant="rectangular" width="100%" height={400} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: "8px", mt: 2 }} />
            </div>
            <aside className="quote-sidebar">
              <Skeleton variant="rectangular" width="100%" height={300} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: "8px" }} />
            </aside>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Error ──
  if (isError) {
    return (
      <Layout>
        <div className="quote-page">
          <div className="quote-header">
            <div className="quote-breadcrumb">
              <Link to="/">HOME</Link>
              <FaAngleRight className="quote-breadcrumb-sep" />
              <span>{symbol}</span>
            </div>
          </div>
          <ErrorState message={`Unable to load data for ${symbol}.`} onRetry={() => refetch()} />
        </div>
      </Layout>
    );
  }

  // ── Shared components ──
  const priceUp = quoteData?.percentChange !== undefined && quoteData.percentChange >= 0;

  const PriceBlock = (
    <div className="quote-price-block">
      <div className="quote-price-row">
        <span className="quote-price">{formatCurrency(quoteData?.price)}</span>
        <span className={`quote-badge ${priceUp ? "positive" : "negative"}`}>
          {priceUp ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />}
          {quoteData?.percentChange !== undefined
            ? ` ${Math.abs(quoteData.percentChange).toFixed(2)}%`
            : ""}
        </span>
        <span className={`quote-change ${priceUp ? "positive" : "negative"}`}>
          {formatPriceChange(quoteData?.priceChange)}
        </span>
        <span className={`quote-interval-label ${priceUp ? "positive" : "negative"}`}>
          {selectedInterval === "1D" ? "Today" : selectedInterval}
        </span>
      </div>
      <div className="quote-meta">
        <span>({marketStatus})</span>
        <span className="quote-meta-sep">·</span>
        <span>{quoteSidebarData?.primaryExchange}</span>
        <Link to="/disclaimer" className="quote-meta-link">Disclaimer</Link>
      </div>
    </div>
  );

  const IntervalButtons = (
    <div className="quote-intervals">
      {["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y", "MAX"].map((iv) => (
        <button
          key={iv}
          className={selectedInterval === iv ? "active" : ""}
          onClick={() => handleIntervalChange(iv)}
        >
          {iv}
        </button>
      ))}
    </div>
  );

  // ── Index view ──
  if (isIndex === true) {
    return (
      <Layout>
        <div className="quote-page">
          <div className="quote-header">
            <div className="quote-breadcrumb">
              <Link to="/">HOME</Link>
              <FaAngleRight className="quote-breadcrumb-sep" />
              <span>{symbol}</span>
              <span className="quote-meta-sep">·</span>
              <span className="quote-exchange">{quoteSidebarData?.primaryExchange}</span>
            </div>
            <h1 className="quote-title">{quoteData?.name}</h1>
          </div>
          <div className="quote-layout quote-layout--single">
            <div className="quote-main">
              {PriceBlock}
              {IntervalButtons}
              <QuoteChart interval={selectedInterval} symbol={chartSymbol || ""} previousClosePrice="" />
            </div>
          </div>
          <Footer />
        </div>
      </Layout>
    );
  }

  // ── Stock view ──
  const hasFinancials = quoteFinancialData && (
    quoteFinancialData.annualRevenue ||
    quoteFinancialData.netIncome ||
    quoteFinancialData.netProfitMargin ||
    quoteFinancialData.ebitda
  );

  const financialRows = [
    { label: "Revenue", value: quoteFinancialData?.annualRevenue },
    { label: "Net Income", value: quoteFinancialData?.netIncome },
    { label: "Net Profit Margin", value: quoteFinancialData?.netProfitMargin },
    { label: "EBITDA", value: quoteFinancialData?.ebitda },
  ].filter((r) => r.value);

  return (
    <Layout>
      <div className="quote-page">
        {/* Header */}
        <div className="quote-header">
          <div className="quote-header-top">
            <div className="quote-breadcrumb">
              <Link to="/">HOME</Link>
              <FaAngleRight className="quote-breadcrumb-sep" />
              <span>{symbol}</span>
              <span className="quote-meta-sep">·</span>
              <span className="quote-exchange">{quoteSidebarData?.primaryExchange}</span>
            </div>
            <button
              className={`quote-follow-btn ${isFollowing ? "following" : ""}`}
              onClick={handleFollow}
              title={isFollowing ? "Already following" : "Add to watchlist"}
            >
              {isFollowing ? <FaCheck size={12} /> : <IoAddSharp size={14} />}
              <span>{isFollowing ? "Following" : "Follow"}</span>
            </button>
          </div>
          <h1 className="quote-title">{quoteData?.name}</h1>
        </div>

        {/* Two-column layout */}
        <div className="quote-layout">
          <div className="quote-main">
            {PriceBlock}
            {IntervalButtons}

            <QuoteChart
              interval={selectedInterval}
              symbol={chartSymbol || symbol || ""}
              previousClosePrice={quoteSidebarData?.previousClose || ""}
            />

            {/* Financials */}
            {hasFinancials && (
              <section className="quote-section">
                <button
                  className="quote-section-toggle"
                  onClick={() => setIsFinancialsOpen(!isFinancialsOpen)}
                >
                  <span>Financials</span>
                  {isFinancialsOpen ? <FaAngleUp /> : <FaAngleDown />}
                </button>
                {isFinancialsOpen && (
                  <div className="quote-financials-body">
                    <div className="quote-financials-subheading">Income Statement</div>
                    {financialRows.map((row) => (
                      <div key={row.label} className="quote-kv-row">
                        <span>{row.label}</span>
                        <span>{row.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* News */}
            <QuoteNews />

            {/* Related */}
            <RelatedStocks currentSymbol={symbol} />
          </div>

          {/* Sidebar */}
          <aside className="quote-sidebar">
            <div className="quote-stats-card">
              {sidebarEntries.map(({ label, key }) => {
                const value = quoteSidebarData?.[key as keyof typeof quoteSidebarData];
                if (!value) return null;
                return (
                  <div key={key} className="quote-kv-row">
                    <span>{label}</span>
                    <span>{value}</span>
                  </div>
                );
              })}
            </div>

            <AiPanel symbol={symbol} quotePageData={quotePageData ?? null} />

            {quoteSidebarAboutData?.summary && (
              <div className="quote-about-card">
                <button
                  className="quote-section-toggle"
                  onClick={() => setIsAboutOpen(!isAboutOpen)}
                >
                  <span>About</span>
                  {isAboutOpen ? <FaAngleUp /> : <FaAngleDown />}
                </button>
                {isAboutOpen && (
                  <div className="quote-about-body">
                    <p className="quote-about-summary">
                      {quoteSidebarAboutData.summary}
                    </p>
                    {quoteSidebarAboutData.ceo && (
                      <div className="quote-kv-row">
                        <span>CEO</span>
                        <span>{quoteSidebarAboutData.ceo}</span>
                      </div>
                    )}
                    {quoteSidebarAboutData.website && (
                      <div className="quote-kv-row">
                        <span>Website</span>
                        <span>
                          <a href={quoteSidebarAboutData.website} target="_blank" rel="noopener noreferrer">
                            {quoteSidebarAboutData.website.replace(/(https?:\/\/)?(www\.)?/g, "").replace(/\/$/, "")}
                          </a>
                        </span>
                      </div>
                    )}
                    {quoteSidebarAboutData.headquarters && (
                      <div className="quote-kv-row">
                        <span>Headquarters</span>
                        <span>{quoteSidebarAboutData.headquarters}</span>
                      </div>
                    )}
                    {quoteSidebarAboutData.employees && (
                      <div className="quote-kv-row">
                        <span>Employees</span>
                        <span>
                          {!isNaN(parseInt(quoteSidebarAboutData.employees, 10))
                            ? parseInt(quoteSidebarAboutData.employees, 10).toLocaleString()
                            : "N/A"}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
        <Footer />
      </div>
    </Layout>
  );
};

export default Quote;
