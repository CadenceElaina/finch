/**
 * EarningsCalendar — Upcoming earnings dates for the user's holdings.
 * Pulls earningsTimestampStart from batch quotes for watchlist + portfolio
 * symbols. Zero extra API calls — piggybacks on cached quote data.
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
    // Collect unique symbols from watchlists + portfolios
    const symbolSet = new Set<string>();
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

        const rawQuotes = response.data?.quoteResponse?.result ?? [];
        const now = new Date();
        const entries: EarningsEntry[] = [];

        for (const q of rawQuotes) {
          const start = q.earningsTimestampStart;
          const end = q.earningsTimestampEnd;
          if (!start) continue;

          const date = new Date(start * 1000);
          // Only show upcoming earnings (within next 90 days)
          if (date < now) continue;
          const diffDays =
            (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays > 90) continue;

          entries.push({
            symbol: q.symbol,
            name: q.shortName ?? q.longName ?? q.symbol,
            date,
            dateEnd: end ? new Date(end * 1000) : undefined,
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

  // Don't render if no symbols tracked
  const hasSymbols =
    watchlists.some((w) => (w.securities?.length ?? 0) > 0) ||
    portfolios.some((p) => (p.securities?.length ?? 0) > 0);
  if (!hasSymbols) return null;

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
          No upcoming earnings for your holdings
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
