/**
 * MarketOverview — AI-generated daily market summary on the Home page.
 * Cached in localStorage per day — one Gemini call per day.
 */

import React, { useCallback, useEffect, useState } from "react";
import { useAi } from "../../context/AiContext";
import { useIndexQuotes } from "../../context/IndexQuotesContext";
import { buildContextBundle, contextToPrompt } from "../../services/contextBundle";
import { cacheStorage } from "../../services/storage";
import { FaRobot } from "react-icons/fa";
import "./MarketOverview.css";

const CACHE_KEY = "ai_market_overview";
const CACHE_TTL = 60 * 60_000; // 1 hour

const MarketOverview: React.FC = () => {
  const { generate, configured, creditsRemaining } = useAi();
  const { indexQuotesData } = useIndexQuotes();

  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Try to load from cache on mount
  useEffect(() => {
    const cached = cacheStorage.get<string>(CACHE_KEY, CACHE_TTL);
    if (cached) setSummary(cached);
  }, []);

  const generateSummary = useCallback(async () => {
    if (!configured || creditsRemaining <= 0) return;
    setLoading(true);
    setError("");
    try {
      const bundle = buildContextBundle({ indexQuotes: indexQuotesData });
      const prompt =
        contextToPrompt(bundle) +
        `Provide a concise market overview for today. Include:
1. Overall market sentiment (bullish/bearish/mixed) in one sentence
2. 3-4 key market developments or themes
3. What to watch for the next trading session

Keep it under 150 words. Use bullet points. Be data-driven.`;

      const text = await generate(prompt);
      setSummary(text);
      cacheStorage.set(CACHE_KEY, text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate summary");
    } finally {
      setLoading(false);
    }
  }, [configured, creditsRemaining, generate, indexQuotesData]);

  if (!configured) return null;

  return (
    <div className="market-overview">
      <div className="market-overview-header">
        <FaRobot size={16} />
        <span>AI Market Overview</span>
      </div>

      {summary ? (
        <div className="market-overview-content">
          {summary.split("\n").map((line, i) => (
            <p key={i}>{line}</p>
          ))}
          <button
            className="market-overview-refresh"
            onClick={generateSummary}
            disabled={loading || creditsRemaining <= 0}
          >
            {loading ? "Generating..." : "Refresh"}
          </button>
        </div>
      ) : (
        <div className="market-overview-empty">
          <p>Get an AI-powered summary of today's market conditions</p>
          <button
            className="market-overview-generate"
            onClick={generateSummary}
            disabled={loading || creditsRemaining <= 0}
          >
            {loading ? (
              <span className="market-overview-loading">Analyzing...</span>
            ) : (
              "Generate Overview"
            )}
          </button>
          {creditsRemaining <= 0 && (
            <p className="market-overview-limit">
              Daily AI credits used. Resets at midnight.
            </p>
          )}
        </div>
      )}

      {error && <p className="market-overview-error">{error}</p>}
    </div>
  );
};

export default MarketOverview;
