/**
 * Demo chart data for popular stocks.
 * Each entry is an array of { time, close, formattedXAxis } matching QuoteChart's shape.
 * We provide 1D and 1M for demo stocks — other periods reuse 1M.
 */

export interface DemoChartPoint {
  time: string;
  close: number;
  formattedXAxis: string;
}

/** Generate a simple sine-wave-ish price series around a base. */
function generateDemoSeries(
  base: number,
  points: number,
  volatility: number,
  labels: string[]
): DemoChartPoint[] {
  const result: DemoChartPoint[] = [];
  let price = base * (1 - volatility * 0.5);
  for (let i = 0; i < points; i++) {
    // Walk the price up with a slight upward trend + noise
    const noise = (Math.sin(i * 0.8) + Math.cos(i * 0.3)) * volatility * base * 0.1;
    price = base + noise + (i / points) * volatility * base * 0.3;
    result.push({
      time: labels[i % labels.length],
      close: Math.round(price * 100) / 100,
      formattedXAxis: labels[i % labels.length],
    });
  }
  return result;
}

const INTRADAY_LABELS = [
  "9:30", "9:45", "10:00", "10:15", "10:30", "10:45", "11:00", "11:15",
  "11:30", "11:45", "12:00", "12:15", "12:30", "12:45", "1:00", "1:15",
  "1:30", "1:45", "2:00", "2:15", "2:30", "2:45", "3:00", "3:15",
  "3:30", "3:45", "4:00",
];

const MONTHLY_LABELS = [
  "Jan 29", "Jan 30", "Jan 31", "Feb 3", "Feb 4", "Feb 5", "Feb 6", "Feb 7",
  "Feb 10", "Feb 11", "Feb 12", "Feb 13", "Feb 14", "Feb 18", "Feb 19",
  "Feb 20", "Feb 21", "Feb 24", "Feb 25", "Feb 26", "Feb 27", "Feb 28",
];

export const DEMO_CHART_DATA: Record<string, Record<string, DemoChartPoint[]>> = {
  AAPL: {
    "1D": generateDemoSeries(241.84, 27, 0.012, INTRADAY_LABELS),
    "1M": generateDemoSeries(237.50, 22, 0.03, MONTHLY_LABELS),
  },
  MSFT: {
    "1D": generateDemoSeries(415.60, 27, 0.008, INTRADAY_LABELS),
    "1M": generateDemoSeries(410.00, 22, 0.025, MONTHLY_LABELS),
  },
  GOOGL: {
    "1D": generateDemoSeries(185.43, 27, 0.010, INTRADAY_LABELS),
    "1M": generateDemoSeries(181.00, 22, 0.028, MONTHLY_LABELS),
  },
  TSLA: {
    "1D": generateDemoSeries(338.59, 27, 0.025, INTRADAY_LABELS),
    "1M": generateDemoSeries(345.00, 22, 0.06, MONTHLY_LABELS),
  },
  NVDA: {
    "1D": generateDemoSeries(131.28, 27, 0.020, INTRADAY_LABELS),
    "1M": generateDemoSeries(125.00, 22, 0.05, MONTHLY_LABELS),
  },
  AMZN: {
    "1D": generateDemoSeries(216.20, 27, 0.012, INTRADAY_LABELS),
    "1M": generateDemoSeries(210.00, 22, 0.03, MONTHLY_LABELS),
  },
  META: {
    "1D": generateDemoSeries(676.10, 27, 0.009, INTRADAY_LABELS),
    "1M": generateDemoSeries(668.00, 22, 0.022, MONTHLY_LABELS),
  },
};

/**
 * Get demo chart data for a symbol / period.
 * Falls back to a generated series if no pre-built data exists.
 */
export function getDemoChartData(symbol: string, period: string): DemoChartPoint[] {
  const sym = symbol.toUpperCase();
  const byPeriod = DEMO_CHART_DATA[sym];
  if (byPeriod) {
    if (byPeriod[period]) return byPeriod[period];
    // Fall back to 1M for any longer period
    if (byPeriod["1M"]) return byPeriod["1M"];
  }
  // Unknown symbol — generate something plausible
  return generateDemoSeries(100, period === "1D" ? 27 : 22, 0.02,
    period === "1D" ? INTRADAY_LABELS : MONTHLY_LABELS);
}
