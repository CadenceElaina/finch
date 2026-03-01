/**
 * MarketOverview — AI-generated daily market summary on the Home page.
 * Cached in localStorage per day — one Gemini call per day.
 */

import React, { useCallback, useEffect, useState } from "react";
import { useAi } from "../../context/AiContext";
import { cacheStorage } from "../../services/storage";
import { FaRobot } from "react-icons/fa";
import "./MarketOverview.css";

const CACHE_KEY = "ai_market_overview";
const CACHE_TTL = 60 * 60_000; // 1 hour

const MarketOverview: React.FC = () => {
  const { generateGrounded, configured, creditsRemaining } = useAi();

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
      const prompt = `Search the web for today's stock market data and provide a concise market overview.

Include:
1. **Market Summary** — What happened today (or last close if weekend/holiday). List the exact closing values and % changes for the Dow Jones, S&P 500, and Nasdaq.
2. **Key Drivers** — 2-3 major themes moving the market (earnings, economic data, geopolitics, sector rotation, etc.)
3. **What to Watch** — 1-2 upcoming catalysts for the next session

Format: Use **bold** for section headers and key numbers. Use bullet points. Keep it under 180 words. Be specific with real numbers and percentages.`;

      const text = await generateGrounded(prompt);
      setSummary(text);
      cacheStorage.set(CACHE_KEY, text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate summary");
    } finally {
      setLoading(false);
    }
  }, [configured, creditsRemaining, generateGrounded]);

  if (!configured) return null;

  return (
    <div className="market-overview">
      <div className="market-overview-header">
        <FaRobot size={16} />
        <span>AI Market Overview</span>
      </div>
      <div className="market-overview-gradient-line" />

      {summary ? (
        <div className="market-overview-content">
          {summary.split("\n").map((line, i) => (
            <p
              key={i}
              dangerouslySetInnerHTML={{
                __html: line
                  .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                  .replace(/\*(.*?)\*/g, "<em>$1</em>"),
              }}
            />
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
