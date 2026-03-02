import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "../../context/ThemeContext";
import {
  getDemoFinancials,
  FinancialSection,
} from "../../data/demo/financials";
import { isDemoActive } from "../../data/demo/demoState";
import { fetchFinancials } from "../../services/financialsApi";
import Skeleton from "@mui/material/Skeleton";
import "./Financials.css";

type SubTab = "income" | "balance" | "cash";

interface Props {
  symbol: string;
}

const SUB_TAB_LABELS: { key: SubTab; label: string }[] = [
  { key: "income", label: "Income statement" },
  { key: "balance", label: "Balance sheet" },
  { key: "cash", label: "Cash flow" },
];

/* Format Y-axis / tooltip values */
const fmtAxis = (val: number): string => {
  const abs = Math.abs(val);
  const sign = val < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(0)}T`;
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(0)}B`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(0)}M`;
  return String(Math.round(val));
};

const fmtTooltip = (val: number): string => {
  const abs = Math.abs(val);
  const sign = val < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)}M`;
  return val.toFixed(2);
};

const Financials: React.FC<Props> = ({ symbol }) => {
  const [subTab, setSubTab] = useState<SubTab>("income");
  const { theme } = useTheme();
  const isLight = theme === "light";
  const demo = isDemoActive();

  /* Live data fetch (skipped in demo mode) */
  const { data: liveData, isLoading } = useQuery({
    queryKey: ["financials", symbol],
    queryFn: () => fetchFinancials(symbol),
    enabled: !demo,
    staleTime: 24 * 60 * 60_000, // 24 h
    gcTime: 48 * 60 * 60_000,
  });

  /* Use live data if available, else fall back to demo */
  const demoData = useMemo(() => getDemoFinancials(symbol), [symbol]);
  const data = (!demo && liveData) ? liveData : demoData;

  if (!data) return null;

  /* Show skeleton while loading live data */
  if (!demo && isLoading) {
    return (
      <div className="fin-section">
        <div className="fin-sub-tabs">
          {SUB_TAB_LABELS.map(({ key, label }) => (
            <button
              key={key}
              className={`fin-sub-tab ${subTab === key ? "active" : ""}`}
              onClick={() => setSubTab(key)}
            >
              {label}
            </button>
          ))}
          <span className="fin-period-badge">● Quarterly</span>
        </div>
        <Skeleton variant="rounded" width="100%" height={220} sx={{ my: 2, bgcolor: isLight ? undefined : "rgba(255,255,255,0.08)" }} />
        <Skeleton variant="rounded" width="100%" height={180} sx={{ bgcolor: isLight ? undefined : "rgba(255,255,255,0.08)" }} />
      </div>
    );
  }

  const section: FinancialSection =
    subTab === "income"
      ? data.incomeStatement
      : subTab === "balance"
        ? data.balanceSheet
        : data.cashFlow;

  /* Build chart data array for Recharts */
  const chartData = section.quarters.map((q, i) => {
    const point: Record<string, string | number> = { quarter: q };
    for (const series of section.chart) {
      point[series.name] = series.data[i];
    }
    return point;
  });

  /* Theme-aware chart palette */
  const PALETTE: Record<string, string> = {
    blue: isLight ? "#1a73e8" : "#8ab4f8",
    lightBlue: isLight ? "#aecbfa" : "#4285f4",
    red: isLight ? "#ea4335" : "#f28b82",
    amber: isLight ? "#f9ab00" : "#fdd663",
  };

  return (
    <div className="fin-section">
      {/* ── Sub-tabs ── */}
      <div className="fin-sub-tabs">
        {SUB_TAB_LABELS.map(({ key, label }) => (
          <button
            key={key}
            className={`fin-sub-tab ${subTab === key ? "active" : ""}`}
            onClick={() => setSubTab(key)}
          >
            {label}
          </button>
        ))}
        <span className="fin-period-badge">● Quarterly</span>
      </div>

      {/* ── Heading + Legend ── */}
      <h4 className="fin-chart-heading">
        {subTab === "income"
          ? "Income statement"
          : subTab === "balance"
            ? "Balance sheet"
            : "Cash flow"}
      </h4>

      <div className="fin-legend">
        {section.chart.map((s) => (
          <span key={s.name} className="fin-legend-item">
            <span
              className="fin-legend-dot"
              style={{ background: PALETTE[s.color] ?? s.color }}
            />
            {s.name}
          </span>
        ))}
      </div>

      {/* ── Bar chart ── */}
      <div className="fin-chart-wrap">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={
                isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)"
              }
            />
            <XAxis
              dataKey="quarter"
              tick={{
                fontSize: 11,
                fill: isLight ? "#5f6368" : "#9aa0a6",
              }}
              axisLine={false}
              tickLine={false}
              reversed
            />
            <YAxis
              tick={{
                fontSize: 11,
                fill: isLight ? "#5f6368" : "#9aa0a6",
              }}
              tickFormatter={fmtAxis}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(val: number, name: string) => [
                fmtTooltip(val),
                name,
              ]}
              contentStyle={{
                background: isLight ? "#fff" : "#303134",
                border: `1px solid ${isLight ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)"}`,
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ fontWeight: 600 }}
            />
            {section.chart.map((s) => (
              <Bar
                key={s.name}
                dataKey={s.name}
                fill={PALETTE[s.color] ?? s.color}
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Data table ── */}
      <div className="fin-table-wrap">
        <table className="fin-table">
          <thead>
            <tr>
              <th className="fin-table-label-th">All values in USD</th>
              {section.quarters.map((q) => (
                <th key={q} className="fin-table-val-th">
                  {q}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {section.rows.map((row) => (
              <tr key={row.label}>
                <td className="fin-table-label-td">{row.label}</td>
                {row.values.map((v, i) => (
                  <td key={i} className="fin-table-val-td">
                    {v ?? "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Financials;
