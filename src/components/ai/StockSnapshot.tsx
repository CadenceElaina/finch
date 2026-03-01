/**
 * StockSnapshot — AI-generated stock summary for the Quote page sidebar.
 * Cached per calendar day per symbol — one generation allowed per day.
 */

import React, { useCallback, useEffect, useState } from "react";
import { useAi } from "../../context/AiContext";
import { cacheStorage } from "../../services/storage";
import { QuotePageData } from "../search/types";
import { FaRobot, FaInfoCircle } from "react-icons/fa";
import "./StockSnapshot.css";

/** Cache entries stick around for 48hrs; but we gate on calendar date, not TTL. */
const CACHE_TTL = 48 * 60 * 60_000;

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

interface SnapshotCache {
  text: string;
  date: string; // YYYY-MM-DD
}

interface StockSnapshotProps {
  symbol: string;
  quotePageData: QuotePageData | null | undefined;
}

const StockSnapshot: React.FC<StockSnapshotProps> = ({ symbol, quotePageData }) => {
  const { generateGrounded, configured, creditsRemaining } = useAi();

  const [snapshot, setSnapshot] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [generatedToday, setGeneratedToday] = useState(false);

  const cacheKey = `ai_snapshot_${symbol.toUpperCase()}`;

  // Load from cache when symbol changes
  useEffect(() => {
    setSnapshot("");
    setError("");
    setGeneratedToday(false);
    const cached = cacheStorage.get<SnapshotCache>(cacheKey, CACHE_TTL);
    if (cached && cached.date === todayDate()) {
      setSnapshot(cached.text);
      setGeneratedToday(true);
    }
  }, [cacheKey]);

  const generateSnapshot = useCallback(async () => {
    if (!configured || creditsRemaining <= 0 || !quotePageData || generatedToday) return;
    setLoading(true);
    setError("");
    try {
      const { quoteData } = quotePageData;
      const prompt = `Search the web for the latest news and data on ${symbol.toUpperCase()} (${quoteData.name}) stock.

Provide a concise stock research snapshot. Use REAL current data from your web search — do not rely solely on the data I provide.

Format your response EXACTLY as:

**Trend**
2-3 sentences on the stock's current momentum, referencing today's price action and recent catalysts from the news.

**Key Metrics**
- Revenue / earnings figures from the most recent quarter
- Current valuation vs sector average
- Any notable analyst price target changes

**Risk Factor**
1 sentence on the primary risk investors should watch.

Keep it under 150 words total. Be specific with numbers and dates. Be factual, not advisory.`;

      const text = await generateGrounded(prompt);
      if (!text || !text.trim()) {
        setError("Received empty response — please try again.");
        return;
      }
      setSnapshot(text);
      setGeneratedToday(true);
      cacheStorage.set(cacheKey, { text, date: todayDate() } as SnapshotCache);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate snapshot");
    } finally {
      setLoading(false);
    }
  }, [configured, creditsRemaining, generateGrounded, symbol, quotePageData, cacheKey, generatedToday]);

  if (!configured) return null;

  return (
    <div className="stock-snapshot">
      <div className="stock-snapshot-header">
        <div className="stock-snapshot-header-left">
          <FaRobot size={14} />
          <span>AI Snapshot</span>
        </div>
        {snapshot && generatedToday && (
          <span className="stock-snapshot-locked" title="Snapshot generated for today. Refreshes tomorrow.">
            <FaInfoCircle size={12} />
          </span>
        )}
      </div>

      {snapshot ? (
        <div className="stock-snapshot-content">
          {snapshot.split("\n").map((line, i) => (
            <p key={i} dangerouslySetInnerHTML={{
              __html: line
                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                .replace(/\*(.*?)\*/g, "<em>$1</em>"),
            }} />
          ))}
        </div>
      ) : (
        <div className="stock-snapshot-empty">
          <button
            className="stock-snapshot-btn"
            onClick={generateSnapshot}
            disabled={loading || creditsRemaining <= 0 || !quotePageData || generatedToday}
          >
            {loading ? "Analyzing..." : `Analyze ${symbol.toUpperCase()}`}
          </button>
          {creditsRemaining <= 0 && !loading && (
            <p className="stock-snapshot-limit">No credits remaining</p>
          )}
        </div>
      )}

      {error && <p className="stock-snapshot-error">{error}</p>}
    </div>
  );
};

export default StockSnapshot;
