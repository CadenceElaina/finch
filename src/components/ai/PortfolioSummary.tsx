/**
 * PortfolioSummary — AI-generated commentary for a user's portfolio.
 *
 * Behavior:
 *   - User portfolios: auto-generates once per day (date-gated) if credits remain.
 *     Cached in localStorage per portfolio ID; re-generated when holdings change.
 *   - Demo portfolios: shows static pre-written commentary (zero API cost).
 *
 * Auto-generation is conservative — it only fires when:
 *   1. No cached summary exists (or holdings fingerprint changed)
 *   2. The user hasn't already auto-generated today (date gate)
 *   3. AI credits remain
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAi } from "../../context/AiContext";
import { isDemoActive } from "../../data/demo/demoState";
import { cacheStorage } from "../../services/storage";
import { Portfolio } from "../../types/types";
import { FaRobot } from "react-icons/fa";
import { BsStars } from "react-icons/bs";
import { FiExternalLink } from "react-icons/fi";
import "./PortfolioSummary.css";

const CACHE_TTL = 12 * 60 * 60_000; // 12 hours

/** Static commentary for demo portfolios — no API call needed. */
const DEMO_COMMENTARY: Record<string, string> = {
  "Growth & Tech": `**Overview** — A concentrated growth portfolio heavily weighted toward large-cap technology. Strong sector conviction with limited diversification outside tech.

**Strengths**
• Core holdings (AAPL, MSFT, NVDA) have dominant market positions and strong free cash flow
• Exposure to secular AI/cloud trends through NVDA and MSFT

**Watch**
• High sector concentration risk — a tech rotation could impact the entire portfolio
• Consider adding defensive or value positions to balance drawdown risk`,

  "Dividends & Value": `**Overview** — An income-focused portfolio blending blue-chip dividend payers with value names. Good sector diversification across financials, healthcare, and energy.

**Strengths**
• Steady dividend income from established payers (JNJ, KO, PG) with long track records
• Energy exposure (XOM) provides inflation hedge and commodity diversification

**Watch**
• Rising interest rates could pressure dividend stock valuations as bonds become more competitive
• Monitor JNJ litigation exposure and its impact on dividend sustainability`,
};

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
  const autoGenAttempted = useRef(false);

  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cacheKey = portfolio ? `ai_portfolio_${portfolio.id}` : "";
  const fingerprintKey = portfolio ? `ai_portfolio_fp_${portfolio.id}` : "";
  const currentFingerprint = holdingsKey(portfolio);

  // Load from cache, demo data, or auto-generate
  useEffect(() => {
    setSummary("");
    setError("");
    autoGenAttempted.current = false;
    if (!portfolio?.securities?.length) return;

    // Demo mode — use static commentary
    if (isDemoActive()) {
      const demoText = DEMO_COMMENTARY[portfolio.title] ?? null;
      if (demoText) {
        setSummary(demoText);
        return;
      }
    }

    // Check cache with fingerprint match
    if (cacheKey && currentFingerprint) {
      const cachedFp = localStorage.getItem(fingerprintKey);
      if (cachedFp === currentFingerprint) {
        const cached = cacheStorage.get<string>(cacheKey, CACHE_TTL);
        if (cached) {
          setSummary(cached);
          return;
        }
      }
    }
  }, [cacheKey, fingerprintKey, currentFingerprint, portfolio]);

  // Auto-generate once per day if no cached summary was loaded
  useEffect(() => {
    if (summary || loading || autoGenAttempted.current) return;
    if (isDemoActive()) return;
    if (!configured || creditsRemaining <= 0) return;
    if (!portfolio?.securities?.length) return;

    // Date gate — only auto-generate once per calendar day per portfolio
    const dateKey = `ai_portfolio_autogen_${portfolio.id}`;
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem(dateKey) === today) return;

    autoGenAttempted.current = true;
    localStorage.setItem(dateKey, today);
    generateSummary();
  }, [summary, loading, configured, creditsRemaining, portfolio]); // eslint-disable-line react-hooks/exhaustive-deps

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
      <div className="portfolio-summary-gradient-line" />

      {summary ? (
        <div className="portfolio-summary-content">
          {summary.split("\n").map((line, i) => (
            <p key={i} dangerouslySetInnerHTML={{
              __html: line
                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                .replace(/\*(.*?)\*/g, "<em>$1</em>"),
            }} />
          ))}
          {!isDemoActive() && (
            <button
              className="portfolio-summary-refresh"
              onClick={generateSummary}
              disabled={loading || creditsRemaining <= 0}
            >
              {loading ? "Analyzing…" : "Refresh"}
            </button>
          )}
        </div>
      ) : (
        <div className="portfolio-summary-empty">
          {loading ? (
            <span>Analyzing…</span>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}

      {error && <p className="portfolio-summary-error">{error}</p>}

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

export default PortfolioSummary;
