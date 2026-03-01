/**
 * StockSnapshot — AI-generated stock summary for the Quote page sidebar.
 * Cached in localStorage per symbol per day.
 */

import React, { useCallback, useEffect, useState } from "react";
import { useAi } from "../../context/AiContext";
import { cacheStorage } from "../../services/storage";
import { QuotePageData } from "../search/types";
import { FaRobot } from "react-icons/fa";
import "./StockSnapshot.css";

const CACHE_TTL = 24 * 60 * 60_000; // 24 hours

interface StockSnapshotProps {
  symbol: string;
  quotePageData: QuotePageData | null | undefined;
}

const StockSnapshot: React.FC<StockSnapshotProps> = ({ symbol, quotePageData }) => {
  const { generateGrounded, configured, creditsRemaining } = useAi();

  const [snapshot, setSnapshot] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const cacheKey = `ai_snapshot_${symbol.toUpperCase()}`;

  // Load from cache when symbol changes
  useEffect(() => {
    setSnapshot("");
    setError("");
    const cached = cacheStorage.get<string>(cacheKey, CACHE_TTL);
    if (cached) setSnapshot(cached);
  }, [cacheKey]);

  const generateSnapshot = useCallback(async () => {
    if (!configured || creditsRemaining <= 0 || !quotePageData) return;
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
      cacheStorage.set(cacheKey, text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate snapshot");
    } finally {
      setLoading(false);
    }
  }, [configured, creditsRemaining, generateGrounded, symbol, quotePageData, cacheKey]);

  if (!configured) return null;

  return (
    <div className="stock-snapshot">
      <div className="stock-snapshot-header">
        <FaRobot size={14} />
        <span>AI Snapshot</span>
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
            disabled={loading || creditsRemaining <= 0 || !quotePageData}
          >
            {loading ? "Analyzing..." : `Analyze ${symbol.toUpperCase()}`}
          </button>
          {creditsRemaining <= 0 && (
            <p className="stock-snapshot-limit">No credits remaining</p>
          )}
        </div>
      )}

      {error && <p className="stock-snapshot-error">{error}</p>}
    </div>
  );
};

export default StockSnapshot;
