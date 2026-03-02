import React, { useEffect, useState, useMemo, useRef } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import QuoteChartLW, { type ChartMode } from "../../components/quote-chart/QuoteChartLW";
import "./Quote.css";
import Footer from "../../components/Footer";
import {
  FaAngleRight,
  FaArrowDown,
  FaArrowUp,
  FaCheck,
} from "react-icons/fa";
import { IoAddSharp } from "react-icons/io5";
import QuoteNews from "../../components/quote-chart/news/QuoteNews";
import RelatedStocks from "../../components/quote-chart/RelatedStocks";
import AnalystRatings from "../../components/quote-chart/AnalystRatings";
import EarningsHistory from "../../components/quote-chart/EarningsHistory";
import Financials from "../../components/quote-chart/Financials";
import AiPanel from "../../components/ai/AiPanel";
import QuoteListsColumn from "../../components/quote-chart/QuoteListsColumn";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getQuotePageData } from "../../components/search/quoteUtils";
import { ENDPOINTS, getQuoteRefreshInterval } from "../../config/api";
import { isHoliday } from "./quoteUtils";
import { formatCurrency, formatPriceChange } from "../../utils/format";
import Skeleton from "@mui/material/Skeleton";
import ErrorState from "../../components/ErrorState";
import { useWatchlists } from "../../context/WatchlistContext";
import { useNotification } from "../../context/NotificationContext";
import WatchlistModal from "../../components/modals/WatchlistModal";
import {
  getInstrumentAbout,
  getMarketCategory,
  CATEGORY_LABELS,
} from "../../data/instrumentInfo";

type QuoteTab = "overview" | "earnings" | "financials";

interface QuoteProps {
  symbol?: string;
  price?: number;
  data?: [];
}

const Quote: React.FC<QuoteProps> = () => {
  const [marketStatus, setMarketStatus] = useState<string>("Closed");
  const [showWatchlistPicker, setShowWatchlistPicker] = useState(false);
  const followBtnRef = useRef<HTMLButtonElement>(null);
  const queryClient = useQueryClient();
  const location = useLocation();
  const { quote: urlParam } = useParams<{ quote: string }>();
  const { state } = location;
  const { watchlists, addSecurityToWatchlist, removeSecurityFromWatchlist } = useWatchlists();
  const { addNotification } = useNotification();

  const isIndex = state?.[0] ?? false;
  const symbol = state?.[1] ? `${state[1]}` : (urlParam ?? "");
  const symbolState = state?.[1] || (urlParam ?? "");

  const KNOWN_INDEXES = ["DJI", "GSPC", "IXIC", "RUT", "VIX", "GDAXI", "FTSE", "FCHI", "IBEX", "STOXX50E", "N225", "HSI", "BSESN", "BSEN", "NSEI", "000001.SS"];
  const KNOWN_CRYPTO = ["BTC-USD", "ETH-USD", "SOL-USD", "XRP-USD", "DOGE-USD"];
  const KNOWN_CURRENCIES = ["EURUSD=X", "JPY=X", "GBPUSD=X", "CAD=X", "AUDUSD=X"];

  const strippedSymbol = symbolState.replace("^", "");
  const detectedIndex = KNOWN_INDEXES.includes(strippedSymbol);
  const isCrypto = KNOWN_CRYPTO.includes(symbolState.toUpperCase());
  const isCurrency = KNOWN_CURRENCIES.includes(symbolState.toUpperCase());
  /** True for any non-stock instrument (index, crypto, currency) */
  const isNonStock = isIndex === true || detectedIndex || isCrypto || isCurrency;

  const chartSymbol = detectedIndex
    ? (symbolState.startsWith("^") ? symbolState : `^${symbolState}`)
    : symbol;

  /** Resolve the instrument about text (if any) */
  const instrumentAbout = getInstrumentAbout(symbolState);
  const marketCategory = getMarketCategory(symbolState);
  const categoryLabel = marketCategory ? CATEGORY_LABELS[marketCategory] : null;

  const [selectedInterval, setSelectedInterval] = useState("1D");
  const [activeTab, setActiveTab] = useState<QuoteTab>("overview");
  const [chartMode, setChartMode] = useState<ChartMode>("area");
  const [showVolume, setShowVolume] = useState(false);

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

  const handleFollow = () => {
    const upper = symbol.toUpperCase();
    if (isFollowing) {
      // Unfollow: remove from all watchlists containing this symbol
      for (const wl of watchlists) {
        const sec = wl.securities?.find((s) => s.symbol.toUpperCase() === upper);
        if (sec) {
          removeSecurityFromWatchlist(wl.id, sec);
        }
      }
      addNotification(`${upper} removed from watchlist`, "info");
      return;
    }
    if (watchlists.length === 0) {
      addNotification("Create a watchlist first to follow stocks.", "info");
      return;
    }
    // If only one watchlist, add directly
    if (watchlists.length === 1) {
      const target = watchlists[0];
      addSecurityToWatchlist(target.id, {
        symbol: upper,
        name: quoteData?.name || upper,
      });
      addNotification(`${upper} added to ${target.title}`, "success");
      return;
    }
    // Multiple watchlists: show picker
    setShowWatchlistPicker(true);
  };

  const handleIntervalChange = (interval: string) => {
    setSelectedInterval(interval);
  };

  useEffect(() => {
    const getCurrentTime = () => {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0=Sun, 6=Sat
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const currentTimeInMinutes = hours * 60 + minutes;
      const marketOpen = 9 * 60 + 30;
      const marketClose = 16 * 60;
      const afterStart = 16 * 60 + 15;
      const afterEnd = 18 * 60 + 30;

      if (isHoliday(now)) {
        setMarketStatus("Closed - Holiday");
      } else if (dayOfWeek === 0 || dayOfWeek === 6) {
        setMarketStatus("Closed - Weekend");
      } else if (currentTimeInMinutes >= marketOpen && currentTimeInMinutes < marketClose) {
        setMarketStatus("Regular Market Hours");
      } else if (currentTimeInMinutes >= afterStart && currentTimeInMinutes <= afterEnd) {
        setMarketStatus("After-Hours Trading");
      } else if (currentTimeInMinutes >= marketClose) {
        setMarketStatus("After-Hours");
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
        <div className="quote-page quote-page--with-lists">
          <QuoteListsColumn />
          <div className="quote-page-center">
          <div className="quote-header">
            <div className="quote-breadcrumb">
              <Link to="/">HOME</Link>
              <FaAngleRight className="quote-breadcrumb-sep" />
              <span>{symbol}</span>
            </div>
            <Skeleton variant="text" width={280} height={36} sx={{ bgcolor: "var(--skeleton-bg)" }} />
          </div>
          <div className="quote-layout">
            <div className="quote-main">
              <Skeleton variant="text" width={180} height={48} sx={{ bgcolor: "var(--skeleton-bg)" }} />
              <Skeleton variant="text" width={120} height={24} sx={{ bgcolor: "var(--skeleton-bg)" }} />
              <Skeleton variant="rectangular" width="100%" height={400} sx={{ bgcolor: "var(--skeleton-bg)", borderRadius: "8px", mt: 2 }} />
            </div>
            <aside className="quote-sidebar">
              <Skeleton variant="rectangular" width="100%" height={300} sx={{ bgcolor: "var(--skeleton-bg)", borderRadius: "8px" }} />
            </aside>
          </div>
          </div>{/* quote-page-center */}
        </div>
      </Layout>
    );
  }

  // ── Error ──
  if (isError) {
    return (
      <Layout>
        <div className="quote-page quote-page--with-lists">
          <QuoteListsColumn />
          <div className="quote-page-center">
          <div className="quote-header">
            <div className="quote-breadcrumb">
              <Link to="/">HOME</Link>
              <FaAngleRight className="quote-breadcrumb-sep" />
              <span>{symbol}</span>
            </div>
          </div>
          <ErrorState message={`Unable to load data for ${symbol}.`} onRetry={() => refetch()} />
          </div>{/* quote-page-center */}
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
    <div className="quote-chart-controls">
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
      <div className="quote-chart-toggles">
        <button
          className={`chart-toggle-btn ${chartMode === "area" ? "active" : ""}`}
          onClick={() => setChartMode("area")}
          title="Line chart"
        >
          Line
        </button>
        <button
          className={`chart-toggle-btn ${chartMode === "candle" ? "active" : ""}`}
          onClick={() => setChartMode("candle")}
          title="Candlestick chart"
        >
          Candle
        </button>
        <span className="chart-toggle-sep" />
        <button
          className={`chart-toggle-btn ${showVolume ? "active" : ""}`}
          onClick={() => setShowVolume((v) => !v)}
          title="Toggle volume"
        >
          Vol
        </button>
      </div>
    </div>
  );

  // ── Index / instrument view ──
  if (isNonStock) {
    const indexSidebarEntries = [
      { label: "Previous Close", key: "previousClose" },
      { label: "Day Range", key: "dayRange" },
      { label: "52 Week Range", key: "fiftyTwoWeekRange" },
    ];

    return (
      <Layout>
        <div className="quote-page quote-page--with-lists">
          <QuoteListsColumn />
          <div className="quote-page-center">
          <div className="quote-header">
            <div className="quote-breadcrumb">
              <Link to="/">HOME</Link>
              <FaAngleRight className="quote-breadcrumb-sep" />
              <span>{symbol}</span>
              <span className="quote-meta-sep">·</span>
              <span className="quote-exchange">{quoteSidebarData?.primaryExchange}</span>
            </div>
            <div className="quote-title-row">
              <h1 className="quote-title">{quoteData?.name}</h1>
              <div style={{ position: "relative" }}>
                <button
                  ref={followBtnRef}
                  className={`quote-follow-btn ${isFollowing ? "following" : ""}`}
                  onClick={handleFollow}
                  title={isFollowing ? "Unfollow" : "Add to watchlist"}
                >
                  {isFollowing ? <FaCheck size={12} /> : <IoAddSharp size={14} />}
                  <span>{isFollowing ? "Following" : "Follow"}</span>
                </button>
                {showWatchlistPicker && (
                  <WatchlistModal
                    watchlists={watchlists}
                    onClose={() => setShowWatchlistPicker(false)}
                    selectedSecurity={symbol.toUpperCase()}
                    style={{ top: "100%", right: 0, marginTop: 4 }}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="quote-layout">
            <div className="quote-main">
              {PriceBlock}
              {IntervalButtons}
              <QuoteChartLW
                interval={selectedInterval}
                symbol={chartSymbol || ""}
                previousClosePrice={quoteSidebarData?.previousClose || ""}
                chartMode={chartMode}
                showVolume={showVolume}
              />

              {/* Related instruments from same market category */}
              <RelatedStocks currentSymbol={symbolState} />

              {/* General news */}
              <QuoteNews useGeneralNews />
            </div>

            <aside className="quote-sidebar">
              {/* Category badge */}
              {categoryLabel && (
                <div className="quote-sidebar-card" style={{ padding: "8px 12px" }}>
                  <span className="quote-category-badge">{categoryLabel}</span>
                </div>
              )}

              {/* Key stats */}
              {quoteSidebarData && (
                <div className="quote-sidebar-card">
                  {indexSidebarEntries.map(({ label, key }) => {
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
              )}

              {/* About */}
              {instrumentAbout && (
                <div className="quote-sidebar-card">
                  <div className="quote-sidebar-card-title">About</div>
                  <p className="quote-sidebar-about-text quote-sidebar-about-full">
                    {instrumentAbout}
                  </p>
                </div>
              )}
            </aside>
          </div>
          <Footer />
          </div>
        </div>
      </Layout>
    );
  }

  // ── Stock view ──
  const hasAbout = Boolean(
    quoteSidebarAboutData?.summary ||
    quoteSidebarAboutData?.ceo ||
    quoteSidebarAboutData?.headquarters ||
    quoteSidebarAboutData?.employees ||
    quoteSidebarAboutData?.website
  );

  const tabs: { key: QuoteTab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "earnings", label: "Earnings" },
    { key: "financials", label: "Financials" },
  ];

  return (
    <Layout>
      <div className="quote-page quote-page--with-lists">
        <QuoteListsColumn />
        <div className="quote-page-center">
        {/* Header */}
        <div className="quote-header">
          <div className="quote-breadcrumb">
            <Link to="/">HOME</Link>
            <FaAngleRight className="quote-breadcrumb-sep" />
            <span>{symbol}</span>
            <span className="quote-meta-sep">·</span>
            <span className="quote-exchange">{quoteSidebarData?.primaryExchange}</span>
          </div>
          <div className="quote-title-row">
            <h1 className="quote-title">{quoteData?.name}</h1>
            <div style={{ position: "relative" }}>
              <button
                className={`quote-follow-btn ${isFollowing ? "following" : ""}`}
                onClick={handleFollow}
                title={isFollowing ? "Unfollow" : "Add to watchlist"}
              >
                {isFollowing ? <FaCheck size={12} /> : <IoAddSharp size={14} />}
                <span>{isFollowing ? "Following" : "Follow"}</span>
              </button>
              {showWatchlistPicker && (
                <WatchlistModal
                  watchlists={watchlists}
                  onClose={() => setShowWatchlistPicker(false)}
                  selectedSecurity={symbol.toUpperCase()}
                  style={{ top: "100%", right: 0, marginTop: 4 }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="quote-layout">
          <div className="quote-main">
            {PriceBlock}
            {IntervalButtons}

            <QuoteChartLW
              interval={selectedInterval}
              symbol={chartSymbol || symbol || ""}
              previousClosePrice={quoteSidebarData?.previousClose || ""}
              chartMode={chartMode}
              showVolume={showVolume}
            />

            {/* Tab nav */}
            <div className="quote-tabs" role="tablist">
              {tabs.map(({ key, label }) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={activeTab === key}
                  className={`quote-tab-btn ${activeTab === key ? "active" : ""}`}
                  onClick={() => setActiveTab(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* ── Overview ── */}
            {activeTab === "overview" && (
              <div className="quote-tab-content">
                {/* News */}
                <QuoteNews />

                {/* Related stocks */}
                <RelatedStocks currentSymbol={symbol} />
              </div>
            )}

            {/* ── Earnings ── */}
            {activeTab === "earnings" && (
              <div className="quote-tab-content">
                <EarningsHistory symbol={symbol} />
                <AnalystRatings symbol={symbol} />
              </div>
            )}

            {/* ── Financials ── */}
            {activeTab === "financials" && (
              <div className="quote-tab-content">
                <Financials symbol={symbol} />
              </div>
            )}

          </div>

          {/* ── Sidebar: About + Stats + AI ── */}
          <aside className="quote-sidebar">
            {/* About snippet — always visible at top of sidebar */}
            {hasAbout && (
              <div className="quote-sidebar-card">
                <div className="quote-sidebar-card-title">About</div>
                {quoteSidebarAboutData?.summary && (
                  <p className="quote-sidebar-about-text">
                    {quoteSidebarAboutData.summary.length > 220
                      ? quoteSidebarAboutData.summary.slice(0, 220) + "…"
                      : quoteSidebarAboutData.summary}
                  </p>
                )}
                <div className="quote-sidebar-about-details">
                  {quoteSidebarAboutData?.ceo && (
                    <div className="quote-kv-row">
                      <span>CEO</span>
                      <span>{quoteSidebarAboutData.ceo}</span>
                    </div>
                  )}
                  {quoteSidebarAboutData?.headquarters && (
                    <div className="quote-kv-row">
                      <span>Headquarters</span>
                      <span>{quoteSidebarAboutData.headquarters}</span>
                    </div>
                  )}
                  {quoteSidebarAboutData?.employees && (
                    <div className="quote-kv-row">
                      <span>Employees</span>
                      <span>
                        {!isNaN(parseInt(quoteSidebarAboutData.employees, 10))
                          ? parseInt(quoteSidebarAboutData.employees, 10).toLocaleString()
                          : quoteSidebarAboutData.employees}
                      </span>
                    </div>
                  )}
                  {quoteSidebarAboutData?.website && (
                    <div className="quote-kv-row">
                      <span>Website</span>
                      <span>
                        <a href={quoteSidebarAboutData.website} target="_blank" rel="noopener noreferrer">
                          {quoteSidebarAboutData.website.replace(/(https?:\/\/)?(www\.)?/g, "").replace(/\/$/, "")}
                        </a>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Key stats */}
            {quoteSidebarData && (
              <div className="quote-sidebar-card">
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
            )}

            {/* AI Research */}
            <AiPanel symbol={symbol} quotePageData={quotePageData ?? null} />
          </aside>
        </div>
        <Footer />
        </div>{/* quote-page-center */}
      </div>
    </Layout>
  );
};

export default Quote;
