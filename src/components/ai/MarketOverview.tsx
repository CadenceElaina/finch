/**
 * MarketOverview — AI-generated daily market summary on the Home page.
 * Cached in localStorage per day — one Gemini call per day.
 */

import React, { useCallback, useEffect, useState } from "react";
import { useAi } from "../../context/AiContext";
import { cacheStorage } from "../../services/storage";
import { FaRobot, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { BsStars } from "react-icons/bs";
import "./MarketOverview.css";

const CACHE_KEY = "ai_market_overview";
const CACHE_TTL = 60 * 60_000; // 1 hour

const MarketOverview: React.FC = () => {
  const { generateGrounded, configured, creditsRemaining } = useAi();

  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [expanded, setExpanded] = useState(false);

  // Try to load from cache on mount, or auto-generate if no cached data
  useEffect(() => {
    const cached = cacheStorage.get<string>(CACHE_KEY, CACHE_TTL);
    if (cached) {
      setSummary(cached);
    } else if (configured && creditsRemaining > 0) {
      // Auto-generate on first visit when no cache exists
      generateSummary();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      if (!text || !text.trim()) {
        setError("Received empty response — please try again.");
        return;
      }
      setSummary(text);
      cacheStorage.set(CACHE_KEY, text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate summary");
    } finally {
      setLoading(false);
    }
  }, [configured, creditsRemaining, generateGrounded]);

  if (!configured) return null;

  /** Parse summary into lines, filtering empties */
  const lines = summary ? summary.split("\n").filter((l) => l.trim()) : [];
  const PREVIEW_LINES = 3;
  const canCollapse = lines.length > PREVIEW_LINES;
  const visibleLines = expanded ? lines : lines.slice(0, PREVIEW_LINES);

  return (
    <div className="market-overview">
      <div
        className="market-overview-header"
        onClick={() => summary && setExpanded((e) => !e)}
        style={{ cursor: summary ? "pointer" : undefined }}
      >
        <FaRobot size={14} />
        <span>AI Market Overview</span>
        {summary && (
          <span className="market-overview-toggle">
            {expanded ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}
          </span>
        )}
      </div>
      <div className="market-overview-gradient-line" />

      {summary ? (
        <div className={`market-overview-content ${!expanded ? "collapsed" : ""}`}>
          {visibleLines.map((line, i) => (
            <p
              key={i}
              dangerouslySetInnerHTML={{
                __html: line
                  .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                  .replace(/\*(.*?)\*/g, "<em>$1</em>"),
              }}
            />
          ))}
          {canCollapse && !expanded && (
            <button
              className="market-overview-expand"
              onClick={() => setExpanded(true)}
            >
              Show more
            </button>
          )}
          {expanded && (
            <button
              className="market-overview-refresh"
              onClick={generateSummary}
              disabled={loading || creditsRemaining <= 0}
            >
              {loading ? "Generating..." : "Refresh"}
            </button>
          )}
        </div>
      ) : (
        <div className="market-overview-empty">
          {loading ? (
            <span className="market-overview-loading">Analyzing markets...</span>
          ) : (
            <>
              <p>Get an AI-powered summary of today's market conditions</p>
              <button
                className="market-overview-generate"
                onClick={generateSummary}
                disabled={loading || creditsRemaining <= 0}
              >
                Generate Overview
              </button>
              {creditsRemaining <= 0 && (
                <p className="market-overview-limit">
                  Daily AI credits used. Resets at midnight.
                </p>
              )}
            </>
          )}
        </div>
      )}

      {error && <p className="market-overview-error">{error}</p>}

      <a
        href="https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash"
        target="_blank"
        rel="noopener noreferrer"
        className="ai-model-badge"
        style={{ margin: '8px 16px 12px' }}
      >
        <BsStars size={12} />
        <span>Gemini 2.5 Flash</span>
      </a>
    </div>
  );
};

export default MarketOverview;
