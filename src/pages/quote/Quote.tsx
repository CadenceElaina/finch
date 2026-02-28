import React, { useEffect, useState } from "react";
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
} from "react-icons/fa";
import QuoteNews from "../../components/quote-chart/news/QuoteNews";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getQuotePageData } from "../../components/search/quoteUtils";
import { IoAddSharp } from "react-icons/io5";
import { CiShare2 } from "react-icons/ci";
import { isHoliday } from "./quoteUtils";

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

  // Derive symbol from navigation state, falling back to URL param for direct navigation
  const isIndex = state?.[0] ?? false;
  const symbol = state?.[1] ? `${state[1]}` : (urlParam ?? "");
  const symbolState = state?.[1] || (urlParam ?? "");

  // For YH Finance chart API, use the actual Yahoo symbol (with ^ prefix for indexes).
  // When navigating via IndexCards, symbolState already has ^ prefix (e.g. "^GSPC").
  // When navigating via URL (e.g. /quote/GSPC), we need to detect and add ^ for known indexes.
  const KNOWN_INDEXES = ["DJI", "GSPC", "IXIC", "RUT", "VIX", "GDAXI", "FTSE", "IBEX", "N225", "HSI", "BSEN"];
  const strippedSymbol = symbolState.replace("^", "");
  const detectedIndex = KNOWN_INDEXES.includes(strippedSymbol);
  const chartSymbol = detectedIndex
    ? (symbolState.startsWith("^") ? symbolState : `^${symbolState}`)
    : symbol;

  // State to track the selected time interval
  const [selectedInterval, setSelectedInterval] = useState("1D");
  const [isAboutOpen, setIsAboutOpen] = useState(true);

  const handleAboutToggle = () => {
    setIsAboutOpen(!isAboutOpen);
  };

  const handleIntervalChange = (interval: string) => {
    // Set the selected interval and update the chart
    setSelectedInterval(interval);
  };

  const { data: quotePageData } = useQuery({
    queryKey: ["quotePageData", symbol],
    queryFn: () =>
      getQuotePageData(queryClient, symbol || "", state[0] || false),
    enabled: Boolean(symbol), // Only enable the query when symbol is available
  });

  useEffect(() => {
    const getCurrentTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      // Convert the current time to minutes for easier comparison
      const currentTimeInMinutes = hours * 60 + minutes;

      // Define the trading hours
      const marketOpenTimeInMinutes = 9 * 60 + 30; // 9:30 AM
      const marketCloseTimeInMinutes = 16 * 60; // 4:00 PM
      const afterHoursStartInMinutes = 16 * 60 + 15; // 4:15 PM
      const afterHoursEndInMinutes = 18 * 60 + 30; // 6:30 PM

      // Compare the current time with trading hours
      if (isHoliday(now)) {
        setMarketStatus("Closed - Holiday");
      } else {
        if (
          currentTimeInMinutes >= marketOpenTimeInMinutes &&
          currentTimeInMinutes < marketCloseTimeInMinutes
        ) {
          setMarketStatus("Regular Market Hours");
        } else if (
          currentTimeInMinutes >= afterHoursStartInMinutes &&
          currentTimeInMinutes <= afterHoursEndInMinutes
        ) {
          setMarketStatus("After-Hours Trading");
        } else if (currentTimeInMinutes >= marketCloseTimeInMinutes) {
          setMarketStatus("Closed");
        } else {
          setMarketStatus("Pre-Market");
        }
      }
    };

    getCurrentTime();

    // Update market status every hour
    const interval = setInterval(getCurrentTime, 3600000); // Set interval to 1 hour (60 minutes * 60 seconds * 1000 milliseconds)

    // Clear interval on component unmount
    return () => clearInterval(interval);
  }, []);
  const quoteData = quotePageData?.quoteData;
  const quoteSidebarData = quotePageData?.quoteSidebarData;
  const quoteSidebarAboutData = quotePageData?.quoteSidebarAboutData;
  const quoteFinancialData = quotePageData?.quoteFinancialData;
  const keyMappings: Record<string, string> = {
    previousClose: "PREVIOUS CLOSE",
    dayRange: "DAY RANGE",
    fiftyTwoWeekHigh: "52 WEEK HIGH",
    marketCap: "MARKET CAP",
    average3MonthVolume: "AVG 3M VOLUME",
    trailingPE: "TRAILING PE",
    dividendYield: "DIVIDEND YIELD",
    primaryExchange: "EXCHANGE",
  };

  // If it's a direct link from an index card, update the symbol from the state
  if (isIndex === true) {
    // ... (rest of the component remains unchanged)
    return (
      <div>
        <Layout>
          <div className="quote-top-container">
            <div className="quote-links">
              <Link to={"/"}>HOME</Link>
              <FaAngleRight className="quote-arrow" />
              <div>{symbol}</div>
              <div className="quote-links-item"> • </div>
              <div className="quote-primary-exchange">
                {quoteSidebarData?.primaryExchange}
              </div>
            </div>
            <div role="heading" className="quote-name">
              {quoteData?.name}
            </div>
          </div>
          <div className="quote-container">
            <div className="">
              <div className="quote-price-container">
                {/* Price, Percent Change, Price Change, Today/Interval on the same row */}
                <div className="quote-price-changes">
                  <div
                    className={
                      quoteData?.percentChange !== undefined &&
                      quoteData?.percentChange >= 0
                        ? "quote-price-positive"
                        : "quote-price-negative"
                    }
                  >
                    ${quoteData?.price}
                  </div>
                  <div
                    className={
                      quoteData?.percentChange !== undefined &&
                      quoteData.percentChange >= 0
                        ? "quote-percent-change-positive"
                        : "quote-percent-change-negative"
                    }
                  >
                    {quoteData?.percentChange !== undefined &&
                    quoteData.percentChange >= 0 ? (
                      <FaArrowUp />
                    ) : (
                      <FaArrowDown />
                    )}

                    {quoteData?.percentChange !== undefined
                      ? `${quoteData.percentChange.toFixed(2)}%`
                      : ""}
                  </div>
                  <div
                    className={
                      quoteData?.priceChange !== undefined &&
                      quoteData.priceChange >= 0
                        ? "quote-price-change-positive"
                        : "quote-price-change-negative"
                    }
                  >
                    {quoteData?.priceChange !== undefined
                      ? quoteData.priceChange > 0
                        ? `+${quoteData.priceChange}`
                        : quoteData.priceChange
                      : ""}
                  </div>
                  <div
                    className={
                      selectedInterval === "1D" &&
                      quoteData?.percentChange !== undefined &&
                      quoteData.percentChange >= 0
                        ? "quote-price-interval-positive"
                        : "quote-price-interval-negative"
                    }
                  >
                    {selectedInterval === "1D" ? "Today" : selectedInterval}
                  </div>
                </div>

                {/* Market status, exchange, and disclaimer on a separate row */}
                <div className="quote-price-subheading">
                  <div>({marketStatus})</div>{" "}
                  <div className="quote-links-item"> • </div>{" "}
                  <div>{quoteSidebarData?.primaryExchange}</div>{" "}
                  <div>
                    <Link to={"/disclaimer"}>Disclaimer</Link>
                  </div>
                </div>
              </div>

              <div className="button-group">
                {["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y", "MAX"].map(
                  (interval) => (
                    <button
                      key={interval}
                      className={selectedInterval === interval ? "active" : ""}
                      onClick={() => handleIntervalChange(interval)}
                    >
                      {interval}
                    </button>
                  )
                )}
              </div>

              {/* Chart component with the selected interval */}
              <QuoteChart
                interval={selectedInterval}
                symbol={chartSymbol || ""}
                previousClosePrice={""}
              />
            </div>
          </div>
        </Layout>
      </div>
    );
  }

  return (
    <div>
      <Layout>
        <div className="quote-top-container">
          <div className="quote-links">
            <Link to={"/"}>HOME</Link>
            <FaAngleRight className="quote-arrow" />
            <div>{symbol}</div>
            <div className="quote-links-item"> • </div>
            <div className="quote-primary-exchange">
              {quoteSidebarData?.primaryExchange}
            </div>
          </div>
          <div role="heading" className="quote-name">
            {quoteData?.name}
          </div>
        </div>
        <div className="quote-container">
          <div className="quote-main-column">
            <div className="quote-price-container">
              {/* Price, Percent Change, Price Change, Today/Interval on the same row */}
              <div className="quote-price-changes">
                <div
                  className={
                    quoteData?.percentChange !== undefined &&
                    quoteData?.percentChange >= 0
                      ? "quote-price-positive"
                      : "quote-price-negative"
                  }
                >
                  ${quoteData?.price}
                </div>
                <div
                  className={
                    quoteData?.percentChange !== undefined &&
                    quoteData.percentChange >= 0
                      ? "quote-percent-change-positive"
                      : "quote-percent-change-negative"
                  }
                >
                  {quoteData?.percentChange !== undefined &&
                  quoteData.percentChange >= 0 ? (
                    <FaArrowUp />
                  ) : (
                    <FaArrowDown />
                  )}

                  {quoteData?.percentChange !== undefined
                    ? `${quoteData.percentChange.toFixed(2)}%`
                    : ""}
                </div>
                <div
                  className={
                    quoteData?.priceChange !== undefined &&
                    quoteData.priceChange >= 0
                      ? "quote-price-change-positive"
                      : "quote-price-change-negative"
                  }
                >
                  {quoteData?.priceChange !== undefined
                    ? quoteData.priceChange > 0
                      ? `+${quoteData.priceChange}`
                      : quoteData.priceChange
                    : ""}
                </div>
                <div
                  className={
                    selectedInterval === "1D" &&
                    quoteData?.percentChange !== undefined &&
                    quoteData.percentChange >= 0
                      ? "quote-price-interval-positive"
                      : "quote-price-interval-negative"
                  }
                >
                  {selectedInterval === "1D" ? "Today" : selectedInterval}
                </div>
              </div>

              {/* Market status, exchange, and disclaimer on a separate row */}
              <div className="quote-price-subheading">
                <div>({marketStatus})</div>{" "}
                <div className="quote-links-item"> • </div>{" "}
                <div>{quoteSidebarData?.primaryExchange}</div>{" "}
                <div>
                  <Link to={"/disclaimer"}>Disclaimer</Link>
                </div>
              </div>
            </div>

            <div className="button-group">
              {["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y", "MAX"].map(
                (interval) => (
                  <button
                    key={interval}
                    className={selectedInterval === interval ? "active" : ""}
                    onClick={() => handleIntervalChange(interval)}
                  >
                    {interval}
                  </button>
                )
              )}
            </div>

            {/* Chart component with the selected interval */}
            <QuoteChart
              interval={selectedInterval}
              symbol={chartSymbol || symbol || ""}
              previousClosePrice={quoteSidebarData?.previousClose || ""}
            />
            <div className="quote-news">
              {" "}
              <QuoteNews />
            </div>
            <div className="quote-financials">
              <div role="heading">Financials</div>
              <div className="quote-financials-income">
                <div role="heading">Income Statement</div>
                <div className="quote-financials-row">
                  <span>Revenue</span>
                  <span>{quoteFinancialData?.annualRevenue}</span>
                </div>
                <div className="quote-financials-row">
                  <span>Net income</span>
                  <span>{quoteFinancialData?.netIncome}</span>
                </div>
                <div className="quote-financials-row">
                  <span>Net profit margin</span>
                  <span>{quoteFinancialData?.netProfitMargin}</span>
                </div>
                <div className="quote-financials-row">
                  <span>EBITDA</span>
                  <span>{quoteFinancialData?.ebitda}</span>
                </div>
              </div>
              <div className="quote-financials-balance">
                <div role="heading">Balance Sheet</div>
              </div>
              <div className="quote-financials-cash">
                <div role="heading">Cash Flow</div>
              </div>
            </div>
          </div>
          <div className="quote-side-column">
            <div className="quote-right-info">
              <div className="quote-data-list">
                <div className="quote-data-buttons">
                  <button>
                    <span>
                      <IoAddSharp style={{ color: "#1a73e8" }} />
                    </span>
                    <span>Follow</span>
                  </button>
                  <button>
                    <span>
                      <CiShare2 />
                    </span>
                    <span>Share</span>
                  </button>
                </div>
                {Object.entries(quoteSidebarData || {}).map(([key, value]) => (
                  <div key={key} className="quote-data-row">
                    {/* Use the mapped key for display */}
                    <div>{keyMappings[key]}</div>
                    <div>{value}</div>
                  </div>
                ))}
              </div>
              <div className={`quote-about ${isAboutOpen ? "open" : "closed"}`}>
                <div
                  role="heading"
                  onClick={handleAboutToggle}
                  className="about-heading"
                >
                  <span>About</span>
                  <span>{isAboutOpen ? <FaAngleUp /> : <FaAngleDown />}</span>
                </div>
                {isAboutOpen && (
                  <div className="quote-about-data">
                    <div className="quote-about-text">
                      {quoteSidebarAboutData?.summary}
                    </div>
                    <div className="quote-about-row">
                      <span>CEO</span>
                      <span>Satya Nedella</span>
                    </div>
                    <div className="quote-about-row">
                      <span>FOUNDED</span>
                      <span>Apr 4, 1975</span>
                    </div>
                    {quoteSidebarAboutData &&
                      Object.entries(quoteSidebarAboutData)
                        .filter(([key]) => key !== "summary")
                        .map(([key, value]) => (
                          <div key={key} className="quote-about-row">
                            <span>{key}</span>
                            {key.toLowerCase() === "website" ? (
                              <span>
                                <a
                                  href={value}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {value.replace(
                                    /(https?:\/\/)?(www\.)|(\.\w{2,3}\.\w{2})/g,
                                    ""
                                  )}
                                </a>
                              </span>
                            ) : key.toLowerCase() === "employees" ? (
                              <span>
                                {value && !isNaN(parseInt(value, 10))
                                  ? parseInt(value, 10).toLocaleString()
                                  : "N/A"}
                              </span>
                            ) : (
                              <span>{value}</span>
                            )}
                          </div>
                        ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </Layout>
    </div>
  );
};

export default Quote;
