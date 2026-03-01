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
  const { generate, configured, creditsRemaining } = useAi();

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
      const { quoteData, quoteSidebarData, quoteSidebarAboutData, quoteFinancialData } = quotePageData;
      const prompt = `Provide a brief stock snapshot for ${symbol.toUpperCase()} (${quoteData.name}).

Current data:
- Price: $${quoteData.price} (${quoteData.percentChange >= 0 ? "+" : ""}${quoteData.percentChange.toFixed(2)}% today)
- Market Cap: ${quoteSidebarData.marketCap}
- P/E Ratio: ${quoteSidebarData.trailingPE || "N/A"}
- 52W Range: ${quoteSidebarData.fiftyTwoWeekRange || "N/A"}
- Dividend Yield: ${quoteSidebarData.dividendYield || "None"}
- Revenue: ${quoteFinancialData.annualRevenue || "N/A"}
- Net Profit Margin: ${quoteFinancialData.netProfitMargin || "N/A"}
- About: ${quoteSidebarAboutData.summary?.slice(0, 200) || "N/A"}

Format your response as:
1. **Trend** — 2-3 sentence summary of the stock's current momentum
2. **Key Metrics** — 3 bullet points of the most important numbers
3. **Risk Factor** — 1 sentence on the primary risk to watch

Keep it under 120 words total. Be factual, not advisory.`;

      const text = await generate(prompt);
      setSnapshot(text);
      cacheStorage.set(cacheKey, text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate snapshot");
    } finally {
      setLoading(false);
    }
  }, [configured, creditsRemaining, generate, symbol, quotePageData, cacheKey]);

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
