import React, { useState, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  StockMetadata,
  classifyMarketCap,
  classifyGeography,
  classifyAssetType,
} from "../../services/stockMetadata";
import { FaExclamationTriangle, FaShieldAlt, FaChartPie } from "react-icons/fa";
import "./PortfolioAnalysis.css";

// ── Types ────────────────────────────────────────────────

export interface HoldingWithMeta {
  symbol: string;
  currentValue: number;
  quantity: number;
  metadata: StockMetadata;
}

interface PortfolioAnalysisProps {
  holdings: HoldingWithMeta[];
  totalValue: number;
}

type AllocTab = "holdings" | "sector" | "marketCap" | "geography" | "assetType";

// ── Constants ────────────────────────────────────────────

const PIE_COLORS = [
  "#4285f4",
  "#34a853",
  "#ea4335",
  "#fbbc04",
  "#ff6d01",
  "#46bdc6",
  "#a142f4",
  "#f538a0",
  "#00bfa5",
  "#8d6e63",
  "#78909c",
  "#7c4dff",
];

const TAB_LABELS: Record<AllocTab, string> = {
  holdings: "Holdings",
  sector: "Sector",
  marketCap: "Market Cap",
  geography: "Geography",
  assetType: "Asset Type",
};

// ── Helpers ──────────────────────────────────────────────

interface AllocEntry {
  name: string;
  value: number;
  pct: number;
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function toEntries(
  map: Record<string, number>,
  totalValue: number
): AllocEntry[] {
  return Object.entries(map)
    .map(([name, value]) => ({
      name,
      value,
      pct: totalValue > 0 ? (value / totalValue) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

// ── Component ────────────────────────────────────────────

const PortfolioAnalysis: React.FC<PortfolioAnalysisProps> = ({
  holdings,
  totalValue,
}) => {
  const [allocTab, setAllocTab] = useState<AllocTab>("holdings");

  // ── Allocation data by category ──
  const allocations = useMemo(() => {
    // Per-position (holdings)
    const byHolding: Record<string, number> = {};
    for (const h of holdings) {
      byHolding[h.symbol] = (byHolding[h.symbol] || 0) + h.currentValue;
    }

    const bySector: Record<string, number> = {};
    const byMarketCap: Record<string, number> = {};
    const byGeo: Record<string, number> = {};
    const byType: Record<string, number> = {};

    for (const h of holdings) {
      const m = h.metadata;

      bySector[m.sector] = (bySector[m.sector] || 0) + h.currentValue;

      const mcCat = classifyMarketCap(m.marketCapRaw);
      byMarketCap[mcCat] = (byMarketCap[mcCat] || 0) + h.currentValue;

      const geo = classifyGeography(m.country);
      byGeo[geo] = (byGeo[geo] || 0) + h.currentValue;

      const aType = classifyAssetType(m.quoteType);
      byType[aType] = (byType[aType] || 0) + h.currentValue;
    }

    return {
      holdings: toEntries(byHolding, totalValue),
      sector: toEntries(bySector, totalValue),
      marketCap: toEntries(byMarketCap, totalValue),
      geography: toEntries(byGeo, totalValue),
      assetType: toEntries(byType, totalValue),
    };
  }, [holdings, totalValue]);

  const activeData = allocations[allocTab];

  // ── Risk Metrics ──
  const riskMetrics = useMemo(() => {
    if (totalValue <= 0 || holdings.length === 0) return null;

    // Weighted beta (only equities with valid beta > 0)
    const equityHoldings = holdings.filter((h) => h.metadata.beta > 0);
    const equityValue = equityHoldings.reduce(
      (s, h) => s + h.currentValue,
      0
    );
    const weightedBeta =
      equityValue > 0
        ? equityHoldings.reduce(
            (s, h) =>
              s + (h.currentValue / equityValue) * h.metadata.beta,
            0
          )
        : 0;

    // Concentration: only flag individual STOCKS > 25% (ETFs/funds are fine per Bogleheads strategies)
    const concentrated = holdings
      .filter((h) => h.metadata.quoteType?.toUpperCase() === "EQUITY")
      .map((h) => ({
        symbol: h.symbol,
        pct: (h.currentValue / totalValue) * 100,
      }))
      .filter((h) => h.pct >= 25)
      .sort((a, b) => b.pct - a.pct);

    // Weighted dividend yield
    const weightedDivYield = holdings.reduce(
      (s, h) =>
        s +
        (h.currentValue / totalValue) * (h.metadata.dividendYield * 100),
      0
    );

    // Weighted P/E (exclude zeros — stocks without earnings)
    const peHoldings = holdings.filter((h) => h.metadata.trailingPE > 0);
    const peValue = peHoldings.reduce((s, h) => s + h.currentValue, 0);
    const weightedPE =
      peValue > 0
        ? peHoldings.reduce(
            (s, h) =>
              s + (h.currentValue / peValue) * h.metadata.trailingPE,
            0
          )
        : 0;

    return { weightedBeta, concentrated, weightedDivYield, weightedPE };
  }, [holdings, totalValue]);

  if (holdings.length === 0) return null;

  return (
    <div className="pa">
      {/* ── Allocation Breakdown ── */}
      <div className="pa-section">
        <div className="pa-tabs-header">
          <h3 className="perf-section-title">
            <FaChartPie
              size={14}
              style={{ marginRight: 6, opacity: 0.7 }}
            />
            Portfolio Breakdown
          </h3>
          <div className="pa-tabs">
            {(Object.keys(TAB_LABELS) as AllocTab[]).map((tab) => (
              <button
                key={tab}
                className={`pa-tab ${allocTab === tab ? "active" : ""}`}
                onClick={() => setAllocTab(tab)}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        </div>

        <div className="pa-alloc-content">
          {activeData.length > 0 ? (
            <div className="pa-alloc-row">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie
                    data={activeData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {activeData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={PIE_COLORS[i % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [
                      `$${fmt(value)}`,
                    ]}
                    contentStyle={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-strong)",
                      borderRadius: 8,
                      fontSize: "0.85rem",
                    }}
                    itemStyle={{ color: "var(--text-primary)" }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="pa-alloc-table">
                <div className="pa-alloc-table-header">
                  <span>Category</span>
                  <span className="pa-alloc-table-num">Value</span>
                  <span className="pa-alloc-table-pct">Weight</span>
                </div>
                {activeData.map((entry, i) => (
                  <div key={entry.name} className="pa-alloc-table-row">
                    <div className="pa-alloc-table-label">
                      <span
                        className="pa-alloc-dot"
                        style={{
                          background:
                            PIE_COLORS[i % PIE_COLORS.length],
                        }}
                      />
                      <span>{entry.name}</span>
                    </div>
                    <span className="pa-alloc-table-num">
                      ${fmt(entry.value)}
                    </span>
                    <span className="pa-alloc-table-pct">
                      {entry.pct.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="pa-empty">No allocation data available</p>
          )}
        </div>
      </div>

      {/* ── Risk & Fundamentals ── */}
      {riskMetrics && (
        <div className="pa-section">
          <h3 className="perf-section-title">
            <FaShieldAlt
              size={14}
              style={{ marginRight: 6, opacity: 0.7 }}
            />
            Risk &amp; Fundamentals
          </h3>
          <div className="pa-risk-grid">
            {/* Beta */}
            <div className="pa-risk-card">
              <span className="pa-risk-label">Portfolio Beta</span>
              <span className="pa-risk-value">
                {riskMetrics.weightedBeta.toFixed(2)}
              </span>
              <div className="pa-risk-beta-bar">
                <span className="pa-risk-hint" style={{ minWidth: 8 }}>
                  0
                </span>
                <div className="pa-risk-beta-track">
                  <div
                    className="pa-risk-beta-marker"
                    style={{
                      left: `${Math.min(
                        100,
                        (riskMetrics.weightedBeta / 2.5) * 100
                      )}%`,
                    }}
                  />
                </div>
                <span className="pa-risk-hint">2.5</span>
              </div>
              <span className="pa-risk-hint">
                {riskMetrics.weightedBeta > 1.3
                  ? "Higher volatility than market"
                  : riskMetrics.weightedBeta > 0.9
                  ? "Near-market volatility"
                  : riskMetrics.weightedBeta > 0
                  ? "Lower volatility than market"
                  : "No beta data"}
              </span>
            </div>

            {/* Concentration */}
            <div
              className={`pa-risk-card ${
                riskMetrics.concentrated.length > 0 ? "pa-risk-warn" : ""
              }`}
            >
              <span className="pa-risk-label">
                Concentration
                {riskMetrics.concentrated.length > 0 && (
                  <FaExclamationTriangle
                    size={11}
                    style={{
                      marginLeft: 5,
                      color: "var(--negative, #ea4335)",
                    }}
                  />
                )}
              </span>
              <span className="pa-risk-value">
                {riskMetrics.concentrated.length > 0
                  ? riskMetrics.concentrated
                      .map(
                        (c) => `${c.symbol} ${c.pct.toFixed(0)}%`
                      )
                      .join(", ")
                  : "Diversified"}
              </span>
              <span className="pa-risk-hint">
                {riskMetrics.concentrated.length > 0
                  ? "Single stock exceeds 25% of portfolio"
                  : "No single stock exceeds 25%"}
              </span>
            </div>

            {/* Dividend Yield */}
            <div className="pa-risk-card">
              <span className="pa-risk-label">Dividend Yield</span>
              <span className="pa-risk-value">
                {riskMetrics.weightedDivYield.toFixed(2)}%
              </span>
              <span className="pa-risk-hint">
                {riskMetrics.weightedDivYield > 3
                  ? "High-yield portfolio"
                  : riskMetrics.weightedDivYield > 1
                  ? "Moderate income"
                  : "Growth-oriented (low yield)"}
              </span>
            </div>

            {/* P/E Ratio */}
            <div className="pa-risk-card">
              <span className="pa-risk-label">P/E Ratio</span>
              <span className="pa-risk-value">
                {riskMetrics.weightedPE > 0
                  ? riskMetrics.weightedPE.toFixed(1)
                  : "—"}
              </span>
              <span className="pa-risk-hint">
                {riskMetrics.weightedPE > 40
                  ? "High-growth valuation"
                  : riskMetrics.weightedPE > 20
                  ? "Moderate valuation"
                  : riskMetrics.weightedPE > 0
                  ? "Value-oriented"
                  : "N/A — no earnings data"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioAnalysis;
