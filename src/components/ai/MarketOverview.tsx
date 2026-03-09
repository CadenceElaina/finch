/**
 * MarketOverview — AI-generated daily market summary on the Home page.
 *
 * Data flow (Option B — server-prefetched):
 *   1. Cron job generates AI overview via Gemini at 5 AM ET → stored in Redis
 *   2. On app load, snapshot arrives with `aiOverview` already populated
 *   3. Component displays the pre-generated overview (zero client-side AI cost)
 *   4. User can manually "Refresh" (costs 1 credit) for a fresher summary
 *   5. In demo mode, shows a static pre-written overview
 *
 * This design conserves the user's 10 daily AI credits for interactive
 * features (Research Chat, Portfolio Analysis) rather than burning one
 * automatically on every page load.
 */

import React, { useCallback, useEffect, useState } from "react";
import { useAi } from "../../context/AiContext";
import { useSnapshot } from "../../context/SnapshotContext";
import { isDemoActive } from "../../data/demo/demoState";
import { cacheStorage } from "../../services/storage";
import { FaRobot, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { BsStars } from "react-icons/bs";
import { FiExternalLink, FiInfo } from "react-icons/fi";
import "./MarketOverview.css";

const CACHE_KEY = "ai_market_overview";
const CACHE_TTL = 12 * 60 * 60_000; // 12 hours — overview is daily, no need to expire quickly

/** Static overview shown in demo mode — no API call needed. */
const DEMO_OVERVIEW = `**Market Summary**
• The **Dow Jones** closed at **42,840.26** (+1.23%), the **S&P 500** at **5,930.85** (+0.82%), and the **Nasdaq** at **19,010.09** (+0.64%.
• All three major indices posted gains, extending a three-day rally.

**Key Drivers**
• **Tech earnings momentum** — Strong results from semiconductor and cloud companies continued to fuel optimism.
• **Fed rate expectations** — Softer-than-expected jobs data reinforced expectations for rate cuts later this year.

**What to Watch**
• **CPI data release** — Tomorrow's inflation report could shift rate-cut timing expectations.`;

/** Format an ISO timestamp as "5:02 AM ET" style string. */
function formatGeneratedAt(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/New_York",
    }) + " ET";
  } catch {
    return "";
  }
}

const MarketOverview: React.FC = () => {
  const { generateGrounded, configured, creditsRemaining } = useAi();
  const { snapshot } = useSnapshot();

  // Initialize from localStorage cache immediately (synchronous) so the
  // summary survives route navigation without waiting for useEffect
  const [summary, setSummary] = useState<string>(() => {
    if (isDemoActive()) return DEMO_OVERVIEW;
    return cacheStorage.get<string>(CACHE_KEY, CACHE_TTL) ?? "";
  });
  const [generatedAt, setGeneratedAt] = useState<string>(() => {
    if (isDemoActive()) return "Pre-built demo data";
    return "";
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [expanded, setExpanded] = useState(false);

  // Update from snapshot when it arrives (server-prefetched takes priority)
  useEffect(() => {
    if (isDemoActive()) {
      setSummary(DEMO_OVERVIEW);
      setGeneratedAt("Pre-built demo data");
      return;
    }

    if (snapshot?.aiOverview) {
      setSummary(snapshot.aiOverview);
      setGeneratedAt(
        snapshot.aiOverviewGeneratedAt
          ? formatGeneratedAt(snapshot.aiOverviewGeneratedAt)
          : ""
      );
      cacheStorage.set(CACHE_KEY, snapshot.aiOverview);
    }
  }, [snapshot]);

  /** Manual refresh — costs 1 AI credit. */
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
      setGeneratedAt(
        formatGeneratedAt(new Date().toISOString())
      );
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
        {generatedAt && (
          <span className="market-overview-timestamp" title="This overview is pre-generated by our server each morning so it doesn't use your daily AI credits.">
            <FiInfo size={11} />
            <span>{generatedAt}</span>
          </span>
        )}
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
          {expanded && !isDemoActive() && (
            <button
              className="market-overview-refresh"
              onClick={generateSummary}
              disabled={loading || creditsRemaining <= 0}
              title="Refresh with latest data (costs 1 AI credit)"
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
        <FiExternalLink size={10} />
      </a>
    </div>
  );
};

export default MarketOverview;
