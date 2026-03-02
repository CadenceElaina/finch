/**
 * Demo chart data for popular stocks.
 * Each entry is an array of { time, close, formattedXAxis } matching QuoteChart's shape.
 * Generates realistic date labels per period (1D, 5D, 1M, 6M, YTD, 1Y, 5Y, MAX).
 */

export interface DemoChartPoint {
  time: string;
  close: number;
  formattedXAxis: string;
}

/* ── Label generators with real dates ── */

/** 1D: half-hour intervals from 9:30 to 4:00 on last trading day */
function gen1DLabels(): string[] {
  return [
    "9:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
    "1:00", "1:30", "2:00", "2:30", "3:00", "3:30", "4:00",
  ];
}

/** 5D: generate last 5 trading day labels (skip weekends) */
function gen5DLabels(): string[] {
  const labels: string[] = [];
  const now = new Date(2026, 1, 28); // Feb 28, 2026 (last market session - Friday)
  let d = new Date(now);
  const dates: Date[] = [];
  while (dates.length < 5) {
    if (d.getDay() !== 0 && d.getDay() !== 6) dates.unshift(new Date(d));
    d.setDate(d.getDate() - 1);
  }
  for (const dt of dates) {
    const lbl = dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    // 3 points per day
    labels.push(lbl);
    labels.push(lbl);
    labels.push(lbl);
  }
  return labels;
}

/** 1M: generate ~22 trading day labels for last month */
function gen1MLabels(): string[] {
  const labels: string[] = [];
  const end = new Date(2026, 1, 28); // Feb 28, 2026
  const d = new Date(end);
  d.setDate(d.getDate() - 31);
  while (d <= end) {
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      labels.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
    }
    d.setDate(d.getDate() + 1);
  }
  return labels;
}

/** 6M: generate ~26 weekly labels for last 6 months — shows year at boundary */
function gen6MLabels(): string[] {
  const labels: string[] = [];
  const end = new Date(2026, 1, 28);
  const d = new Date(end);
  d.setMonth(d.getMonth() - 6);
  while (d <= end) {
    labels.push(d.toLocaleDateString("en-US", { month: "short", year: "numeric" }));
    d.setDate(d.getDate() + 7);
  }
  return labels;
}

/** YTD: generate weekly labels from Jan 1 to now */
function genYTDLabels(): string[] {
  const labels: string[] = [];
  const d = new Date(2026, 0, 2); // Jan 2, 2026
  const end = new Date(2026, 1, 28);
  while (d <= end) {
    labels.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
    d.setDate(d.getDate() + 7);
  }
  return labels;
}

/** 1Y: generate bi-weekly labels for last year — full year shown */
function gen1YLabels(): string[] {
  const labels: string[] = [];
  const end = new Date(2026, 1, 28);
  const d = new Date(end);
  d.setFullYear(d.getFullYear() - 1);
  while (d <= end) {
    labels.push(d.toLocaleDateString("en-US", { month: "short", year: "numeric" }));
    d.setDate(d.getDate() + 14);
  }
  return labels;
}

/** 5Y: generate monthly labels — year markers at January, other months hidden */
function gen5YLabels(): string[] {
  const labels: string[] = [];
  const end = new Date(2026, 1, 28);
  const d = new Date(end);
  d.setFullYear(d.getFullYear() - 5);
  while (d <= end) {
    if (d.getMonth() === 0) {
      // January → show just the year (tick marker)
      labels.push(String(d.getFullYear()));
    } else {
      // Other months → unique but won't show as tick
      labels.push(`${d.toLocaleDateString("en-US", { month: "short" })} ${d.getFullYear()}`);
    }
    d.setMonth(d.getMonth() + 1);
  }
  return labels;
}

/** MAX: generate quarterly labels for ~20 years — year markers every 4 years */
function genMAXLabels(): string[] {
  const labels: string[] = [];
  const end = new Date(2026, 1, 28);
  const d = new Date(2006, 0, 1);
  while (d <= end) {
    if (d.getMonth() === 0 && d.getFullYear() % 4 === 2) {
      // Show year marker: 2006, 2010, 2014, 2018, 2022, 2026
      labels.push(String(d.getFullYear()));
    } else {
      labels.push(`Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`);
    }
    d.setMonth(d.getMonth() + 3);
  }
  return labels;
}

// Pre-compute label arrays
const LABELS_1D = gen1DLabels();
const LABELS_5D = gen5DLabels();
const LABELS_1M = gen1MLabels();
const LABELS_6M = gen6MLabels();
const LABELS_YTD = genYTDLabels();
const LABELS_1Y = gen1YLabels();
const LABELS_5Y = gen5YLabels();
const LABELS_MAX = genMAXLabels();

interface PeriodConfig {
  labels: string[];
  volatility: number;
  priceOffsetPct: number; // how far back price starts relative to 'base'
}

function getPeriodConfig(period: string): PeriodConfig {
  switch (period) {
    case "1D":  return { labels: LABELS_1D, volatility: 0.008, priceOffsetPct: 0 };
    case "5D":  return { labels: LABELS_5D, volatility: 0.015, priceOffsetPct: -0.01 };
    case "1M":  return { labels: LABELS_1M, volatility: 0.03, priceOffsetPct: -0.02 };
    case "6M":  return { labels: LABELS_6M, volatility: 0.08, priceOffsetPct: -0.05 };
    case "YTD": return { labels: LABELS_YTD, volatility: 0.06, priceOffsetPct: -0.03 };
    case "1Y":  return { labels: LABELS_1Y, volatility: 0.12, priceOffsetPct: -0.08 };
    case "5Y":  return { labels: LABELS_5Y, volatility: 0.30, priceOffsetPct: -0.20 };
    case "MAX": return { labels: LABELS_MAX, volatility: 0.60, priceOffsetPct: -0.50 };
    default:    return { labels: LABELS_1M, volatility: 0.03, priceOffsetPct: -0.02 };
  }
}

/** Seed-based pseudo-random for deterministic per-symbol series */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashSymbol(sym: string): number {
  let h = 0;
  for (let i = 0; i < sym.length; i++) h = ((h << 5) - h + sym.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Stock base prices for demo
const STOCK_BASES: Record<string, number> = {
  AAPL: 241.84, MSFT: 415.60, GOOGL: 185.43, TSLA: 338.59,
  NVDA: 131.28, AMZN: 216.20, META: 676.10, JPM: 268.44,
  V: 342.90, WMT: 97.84, AMD: 113.72, NFLX: 1028.35,
  CRM: 308.40, INTC: 24.38, BA: 178.92, UBER: 72.48,
  SHOP: 118.25, COST: 1005.32,
};

function generatePeriodSeries(symbol: string, period: string): DemoChartPoint[] {
  const upper = symbol.toUpperCase();
  const base = STOCK_BASES[upper] ?? 100;
  const config = getPeriodConfig(period);
  const points = config.labels.length;
  const rand = seededRandom(hashSymbol(upper) + hashSymbol(period));

  const result: DemoChartPoint[] = [];
  let price = base * (1 + config.priceOffsetPct);
  const target = base;
  const step = (target - price) / points;

  for (let i = 0; i < points; i++) {
    const noise = (Math.sin(i * 0.8 + rand() * 3) + Math.cos(i * 0.3 + rand() * 2)) * config.volatility * base * 0.05;
    const drift = (rand() - 0.48) * config.volatility * base * 0.02;
    price += step + noise * 0.3 + drift;
    result.push({
      time: config.labels[i],
      close: Math.round(price * 100) / 100,
      formattedXAxis: config.labels[i],
    });
  }
  return result;
}

// Keep the legacy export shape (pre-built 1D/1M only for backwards compat)
export const DEMO_CHART_DATA: Record<string, Record<string, DemoChartPoint[]>> = {};

/**
 * Get demo chart data for a symbol / period.
 * Generates period-appropriate date labels for every interval.
 */
export function getDemoChartData(symbol: string, period: string): DemoChartPoint[] {
  return generatePeriodSeries(symbol, period);
}
