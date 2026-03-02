/**
 * EarningsCalendar — Upcoming earnings dates.
 * Shows earnings for the user's holdings PLUS major stocks so
 * the calendar is useful even for new users.
 * Piggybacks on the batch quotes endpoint (earningsTimestampStart field).
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWatchlists } from "../../context/WatchlistContext";
import { usePortfolios } from "../../context/PortfoliosContext";
import { yhFetch } from "../../config/api";
import { ENDPOINTS } from "../../config/api";
import { cacheStorage } from "../../services/storage";
import { isDemoActive } from "../../data/demo";
import { FaCalendarAlt } from "react-icons/fa";
import "./right.css";

/** Major tickers to always check for upcoming earnings */
const NOTABLE_TICKERS = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA",
  "JPM", "V", "JNJ", "WMT", "PG", "UNH", "HD", "DIS",
  "NFLX", "PYPL", "INTC", "AMD", "CRM", "BA", "GS",
  "COST", "MCD", "NKE",
];

interface EarningsEntry {
  symbol: string;
  name: string;
  date: Date;
  dateEnd?: Date;
}

const CACHE_KEY = "earnings_calendar";
const CACHE_TTL = 4 * 60 * 60_000; // 4 hours

const EarningsCalendar: React.FC = () => {
  const { watchlists } = useWatchlists();
  const { portfolios } = usePortfolios();
  const [earnings, setEarnings] = useState<EarningsEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Collect unique symbols from watchlists + portfolios + notable tickers
    const symbolSet = new Set<string>(NOTABLE_TICKERS);
    watchlists.forEach((w) =>
      w.securities?.forEach((s) => symbolSet.add(s.symbol.toUpperCase()))
    );
    portfolios.forEach((p) =>
      p.securities?.forEach((s) => symbolSet.add(s.symbol.toUpperCase()))
    );

    const symbols = Array.from(symbolSet);
    if (symbols.length === 0) return;

    // Check cache first
    const cached = cacheStorage.get<EarningsEntry[]>(CACHE_KEY, CACHE_TTL);
    if (cached && cached.length > 0) {
      // Rehydrate Date objects from JSON strings
      setEarnings(
        cached.map((e) => ({
          ...e,
          date: new Date(e.date),
          dateEnd: e.dateEnd ? new Date(e.dateEnd) : undefined,
        }))
      );
      return;
    }

    if (isDemoActive()) return;

    const fetchEarnings = async () => {
      setLoading(true);
      try {
        const symbolsParam = symbols.slice(0, 50).join(","); // API max ~50
        const response = await yhFetch(ENDPOINTS.batchQuotes.path, {
          region: "US",
          symbols: symbolsParam,
        });

        const rawQuotes =
          response.data?.quoteResponse?.result ??
          response.data?.quoteSummary?.result ??
          [];
        const now = new Date();
        const entries: EarningsEntry[] = [];

        for (const q of rawQuotes) {
          // Handle both flat and nested (quoteSummary) formats
          const flat = q.calendarEvents ?? q;
          const price = q.price ?? q;
          const start = flat.earningsTimestampStart ?? flat.earnings?.earningsDate?.[0]?.raw;
          const end = flat.earningsTimestampEnd ?? flat.earnings?.earningsDate?.[1]?.raw;
          if (!start) continue;

          const ts = typeof start === "object" ? start.raw : start;
          const date = new Date(ts * 1000);
          // Only show upcoming earnings (within next 90 days)
          if (date < now) continue;
          const diffDays =
            (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays > 90) continue;

          const tsEnd = end ? (typeof end === "object" ? end.raw : end) : undefined;

          entries.push({
            symbol: price.symbol ?? q.symbol,
            name: price.shortName ?? price.longName ?? q.shortName ?? q.longName ?? q.symbol,
            date,
            dateEnd: tsEnd ? new Date(tsEnd * 1000) : undefined,
          });
        }

        // Sort by soonest first
        entries.sort((a, b) => a.date.getTime() - b.date.getTime());
        setEarnings(entries);
        if (entries.length > 0) {
          cacheStorage.set(CACHE_KEY, entries);
        }
      } catch (err) {
        console.error("EarningsCalendar fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchlists, portfolios]);

  // Component always renders (notable tickers ensure we have something to show)

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const getDaysUntil = (d: Date) => {
    const now = new Date();
    const diff = Math.ceil(
      (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    return `${diff}d`;
  };

  return (
    <div className="earnings-calendar-container">
      <div className="earnings-calendar-header">
        <FaCalendarAlt size={14} />
        <span>Upcoming Earnings</span>
      </div>

      {loading && (
        <div className="earnings-calendar-loading">Loading…</div>
      )}

      {!loading && earnings.length === 0 && (
        <div className="earnings-calendar-empty">
          No upcoming earnings in the next 90 days
        </div>
      )}

      {!loading && earnings.length > 0 && (
        <div className="earnings-calendar-list">
          {earnings.slice(0, 8).map((entry) => (
            <Link
              key={entry.symbol}
              to={`/quote/${entry.symbol}`}
              state={[false, entry.symbol]}
              className="earnings-calendar-row"
            >
              <div className="earnings-calendar-symbol">{entry.symbol}</div>
              <div className="earnings-calendar-name">{entry.name}</div>
              <div className="earnings-calendar-date">
                {formatDate(entry.date)}
              </div>
              <div className="earnings-calendar-countdown">
                {getDaysUntil(entry.date)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default EarningsCalendar;
