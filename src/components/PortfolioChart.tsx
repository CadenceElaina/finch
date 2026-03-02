import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface PortfolioChartProps {
  chartName: string;
  data: Array<{ date: string; value: string | number }>;
}

const PortfolioChart: React.FC<PortfolioChartProps> = ({ data }) => {
  const validData = data
    .filter((entry) => {
      const val = Number(entry.value);
      return !isNaN(val) && isFinite(val);
    })
    .map((entry) => ({ date: entry.date, value: Number(entry.value) }));

  if (validData.length === 0) {
    return (
      <div className="portfolio-chart">
        <p style={{ color: "var(--text-secondary, #999)", fontSize: "0.85rem" }}>
          Portfolio value will appear here after the next trading day
        </p>
      </div>
    );
  }

  const first = validData[0].value;
  const last = validData[validData.length - 1].value;
  const color = last >= first ? "var(--positive, #34a853)" : "var(--negative, #ea4335)";

  return (
    <div className="portfolio-chart">
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={validData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #333)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "var(--text-secondary, #999)" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--text-secondary, #999)" }}
            axisLine={false}
            tickLine={false}
            domain={["auto", "auto"]}
            tickFormatter={(v: number) => `$${v.toLocaleString()}`}
            width={65}
          />
          <Tooltip
            contentStyle={{
              background: "var(--bg-elevated, #1e1e1e)",
              border: "1px solid var(--border-strong, #444)",
              borderRadius: 8,
              fontSize: "0.85rem",
              color: "var(--text-primary, #fff)",
            }}
            formatter={(value: number) => [`$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, "Value"]}
            labelStyle={{ color: "var(--text-secondary, #999)" }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill="url(#portfolioGrad)"
            dot={false}
            activeDot={{ r: 4, fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PortfolioChart;
