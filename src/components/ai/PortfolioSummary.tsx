/**
 * PortfolioSummary — AI-generated commentary for a user's portfolio.
 * Cached in localStorage per portfolio ID; regenerated when holdings change.
 */

import React, { useCallback, useEffect, useState } from "react";
import { useAi } from "../../context/AiContext";
import { cacheStorage } from "../../services/storage";
import { Portfolio } from "../../types/types";
import { FaRobot } from "react-icons/fa";
import "./PortfolioSummary.css";

const CACHE_TTL = 12 * 60 * 60_000; // 12 hours

interface PortfolioSummaryProps {
  portfolio: Portfolio | undefined;
}

/** Build a fingerprint from portfolio holdings so we can invalidate cache on change. */
function holdingsKey(p: Portfolio | undefined): string {
  if (!p || !p.securities?.length) return "";
  return p.securities
    .map((s) => `${s.symbol}:${s.quantity}`)
    .sort()
    .join(",");
}

const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({ portfolio }) => {
  const { generate, configured, creditsRemaining } = useAi();

  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cacheKey = portfolio ? `ai_portfolio_${portfolio.id}` : "";
  const fingerprintKey = portfolio ? `ai_portfolio_fp_${portfolio.id}` : "";
  const currentFingerprint = holdingsKey(portfolio);

  // Load from cache if fingerprint matches
  useEffect(() => {
    setSummary("");
    setError("");
    if (!cacheKey || !currentFingerprint) return;

    const cachedFp = localStorage.getItem(fingerprintKey);
    if (cachedFp === currentFingerprint) {
      const cached = cacheStorage.get<string>(cacheKey, CACHE_TTL);
      if (cached) setSummary(cached);
    }
  }, [cacheKey, fingerprintKey, currentFingerprint]);

  const generateSummary = useCallback(async () => {
    if (!configured || creditsRemaining <= 0 || !portfolio?.securities?.length) return;
    setLoading(true);
    setError("");
    try {
      const holdingsList = portfolio.securities
        .map((s) => `${s.symbol.toUpperCase()} — ${s.quantity} shares @ $${s.purchasePrice?.toFixed(2) ?? "N/A"}`)
        .join("\n");

      const prompt = `Provide a brief portfolio commentary for "${portfolio.title}":

Holdings:
${holdingsList}

Format your response as:
1. **Overview** — 2 sentences summarizing diversification and sector exposure
2. **Strengths** — 2 bullet points
3. **Watch** — 1-2 concerns or risks to monitor

Keep it under 100 words. Be factual, not advisory.`;

      const text = await generate(prompt);
      setSummary(text);
      cacheStorage.set(cacheKey, text);
      localStorage.setItem(fingerprintKey, currentFingerprint);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate summary");
    } finally {
      setLoading(false);
    }
  }, [configured, creditsRemaining, generate, portfolio, cacheKey, fingerprintKey, currentFingerprint]);

  if (!configured || !portfolio?.securities?.length) return null;

  return (
    <div className="portfolio-summary">
      <div className="portfolio-summary-header">
        <FaRobot size={14} />
        <span>AI Commentary</span>
      </div>

      {summary ? (
        <div className="portfolio-summary-content">
          {summary.split("\n").map((line, i) => (
            <p key={i} dangerouslySetInnerHTML={{
              __html: line
                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                .replace(/\*(.*?)\*/g, "<em>$1</em>"),
            }} />
          ))}
          <button
            className="portfolio-summary-refresh"
            onClick={generateSummary}
            disabled={loading || creditsRemaining <= 0}
          >
            {loading ? "Analyzing…" : "Refresh"}
          </button>
        </div>
      ) : (
        <div className="portfolio-summary-empty">
          <button
            className="portfolio-summary-btn"
            onClick={generateSummary}
            disabled={loading || creditsRemaining <= 0}
          >
            {loading ? "Analyzing…" : "Analyze Portfolio"}
          </button>
          {creditsRemaining <= 0 && (
            <p className="portfolio-summary-limit">No credits remaining</p>
          )}
        </div>
      )}

      {error && <p className="portfolio-summary-error">{error}</p>}
    </div>
  );
};

export default PortfolioSummary;
