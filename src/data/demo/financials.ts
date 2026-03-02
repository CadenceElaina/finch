/**
 * Demo quarterly financial data generator.
 * Uses MSFT as a base template and scales per-stock for realistic demo financials.
 * Each stock gets deterministic, unique data via seeded PRNG.
 */

/* ── Types ── */

export interface FinancialRow {
  label: string;
  values: (string | null)[];
}

export interface ChartSeries {
  name: string;
  data: number[];
  color: string;
}

export interface FinancialSection {
  quarters: string[];
  rows: FinancialRow[];
  chart: ChartSeries[];
}

export interface StockFinancials {
  incomeStatement: FinancialSection;
  balanceSheet: FinancialSection;
  cashFlow: FinancialSection;
}

/* ── Seeded PRNG ── */

function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashSym(sym: string): number {
  let h = 0;
  for (let i = 0; i < sym.length; i++) h = ((h << 5) - h + sym.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/* ── Formatting ── */

function fmtV(val: number): string {
  const abs = Math.abs(val);
  const sign = val < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)}M`;
  if (abs === 0) return "-";
  return val.toFixed(2);
}

function fmtPct(val: number): string {
  return `${val.toFixed(2)}%`;
}

function fmtEps(val: number): string {
  return val.toFixed(2);
}

/* ── MSFT base template (quarterly: Mar/Jun/Sep/Dec 2025) ── */

const BASE_QUARTERS = ["Mar 2025", "Jun 2025", "Sep 2025", "Dec 2025"];

const BASE = {
  // Income statement
  revenue:    [70.07e9, 76.44e9, 77.67e9, 81.27e9],
  cogs:       [21.92e9, 24.01e9, 24.04e9, 25.98e9],
  rd:         [8.20e9, 8.83e9, 8.15e9, 8.50e9],
  sga:        [7.95e9, 9.28e9, 7.52e9, 8.52e9],
  opIncome:   [32.00e9, 34.32e9, 37.96e9, 38.28e9],
  otherIncome:[0.518e9, 1.60e9, 1.21e9, 0.106e9],
  taxExpense: [5.55e9, 5.38e9, 6.55e9, 9.79e9],
  taxRate:    [17.70, 16.50, 19.11, 20.29],
  netIncome:  [25.82e9, 27.23e9, 27.75e9, 38.46e9],
  netMargin:  [36.86, 35.63, 35.72, 47.32],
  eps:        [3.46, 3.65, 4.13, 4.14],
  ebitda:     [40.74e9, 39.37e9, 46.56e9, 47.38e9],

  // Balance sheet
  cash:             [28.83e9, 30.24e9, 28.85e9, 24.30e9],
  shortTermInv:     [50.79e9, 64.32e9, 73.16e9, 65.17e9],
  totalReceivables: [62.50e9, 78.11e9, 67.29e9, 71.64e9],
  inventory:        [0.848e9, 0.938e9, 1.13e9, 1.06e9],
  currentAssets:    [156.64e9, 191.13e9, 189.07e9, 180.19e9],
  netPPE:           [208.41e9, 229.79e9, 255.65e9, 286.23e9],
  goodwill:         [119.33e9, 119.51e9, 119.50e9, 119.62e9],
  intangibles:      [23.97e9, 22.60e9, 21.24e9, 20.29e9],
  totalAssets:      [562.62e9, 619.00e9, 636.35e9, 665.30e9],
  accountsPayable:  [26.25e9, 27.72e9, 32.58e9, 37.33e9],
  longTermDebt:     [39.88e9, 40.15e9, 35.38e9, 35.43e9],
  totalLiabilities: [240.73e9, 275.52e9, 273.28e9, 274.43e9],
  totalEquity:      [321.89e9, 343.48e9, 363.08e9, 390.88e9],
  retainedEarnings: [219.76e9, 237.73e9, 254.87e9, 280.79e9],
  bvps:             [43.30, 46.20, 48.84, 52.61],

  // Cash flow
  opsFlow:     [37.04e9, 42.65e9, 45.06e9, 35.76e9],
  investFlow:  [-12.71e9, -30.57e9, -34.56e9, -22.71e9],
  financeFlow: [-13.04e9, -10.84e9, -11.80e9, -17.62e9],
  netChange:   [11.35e9, 1.41e9, -1.39e9, -4.55e9],
  fcf:         [19.82e9, 19.11e9, 13.71e9, -0.21e9],
  repurchase:  [-4.78e9, -4.55e9, -5.65e9, -7.42e9],
  dividends:   [-6.17e9, -6.17e9, -6.17e9, -6.76e9],
};

/* ── Per-stock profiles ── */

interface Profile {
  scale: number;        // revenue multiplier vs MSFT
  netMarginPct: number; // average net margin
  epsBase: number;      // base EPS level
  assetRatio: number;   // total assets / annual revenue
  debtRatio: number;    // liabilities / assets
  cogsRatio: number;    // COGS / revenue
  rdRatio: number;      // R&D / revenue
}

const PROFILES: Record<string, Profile> = {
  MSFT:  { scale: 1.00, netMarginPct: 36, epsBase: 3.50, assetRatio: 2.15, debtRatio: 0.41, cogsRatio: 0.31, rdRatio: 0.11 },
  AAPL:  { scale: 1.28, netMarginPct: 26, epsBase: 1.65, assetRatio: 0.85, debtRatio: 0.55, cogsRatio: 0.56, rdRatio: 0.08 },
  GOOGL: { scale: 1.14, netMarginPct: 28, epsBase: 2.10, assetRatio: 1.10, debtRatio: 0.29, cogsRatio: 0.42, rdRatio: 0.14 },
  NVDA:  { scale: 0.44, netMarginPct: 56, epsBase: 0.70, assetRatio: 1.20, debtRatio: 0.36, cogsRatio: 0.25, rdRatio: 0.11 },
  TSLA:  { scale: 0.34, netMarginPct: 8,  epsBase: 0.55, assetRatio: 1.50, debtRatio: 0.40, cogsRatio: 0.75, rdRatio: 0.07 },
  AMZN:  { scale: 2.10, netMarginPct: 9,  epsBase: 1.50, assetRatio: 0.60, debtRatio: 0.48, cogsRatio: 0.58, rdRatio: 0.14 },
  META:  { scale: 0.56, netMarginPct: 35, epsBase: 6.00, assetRatio: 1.10, debtRatio: 0.28, cogsRatio: 0.18, rdRatio: 0.28 },
  JPM:   { scale: 0.59, netMarginPct: 28, epsBase: 4.40, assetRatio: 8.50, debtRatio: 0.92, cogsRatio: 0.35, rdRatio: 0.03 },
  V:     { scale: 0.13, netMarginPct: 52, epsBase: 2.60, assetRatio: 2.20, debtRatio: 0.54, cogsRatio: 0.28, rdRatio: 0.07 },
  WMT:   { scale: 2.15, netMarginPct: 3,  epsBase: 0.60, assetRatio: 0.35, debtRatio: 0.55, cogsRatio: 0.75, rdRatio: 0.01 },
  AMD:   { scale: 0.10, netMarginPct: 8,  epsBase: 0.62, assetRatio: 1.40, debtRatio: 0.30, cogsRatio: 0.48, rdRatio: 0.25 },
  NFLX:  { scale: 0.13, netMarginPct: 22, epsBase: 5.40, assetRatio: 0.85, debtRatio: 0.50, cogsRatio: 0.56, rdRatio: 0.10 },
};

/* ── Noise helper: adds ±pct variation ── */

function noise(rand: () => number, base: number, pct: number = 0.05): number {
  return base * (1 + (rand() - 0.5) * 2 * pct);
}

/* ── Generator ── */

export function getDemoFinancials(symbol: string): StockFinancials {
  const upper = symbol.toUpperCase();
  const rand = seededRand(hashSym(upper) + 9999);

  // Get profile or generate a default one
  const p = PROFILES[upper] ?? {
    scale: 0.1 + (hashSym(upper) % 200) / 100, // 0.1–2.1
    netMarginPct: 10 + (hashSym(upper) % 40),
    epsBase: 0.5 + (hashSym(upper) % 500) / 100,
    assetRatio: 0.5 + (hashSym(upper) % 300) / 100,
    debtRatio: 0.25 + (hashSym(upper) % 60) / 100,
    cogsRatio: 0.2 + (hashSym(upper) % 50) / 100,
    rdRatio: 0.02 + (hashSym(upper) % 25) / 100,
  };

  const s = p.scale;
  const quarters = [...BASE_QUARTERS];

  // ─── Income Statement ───
  const revenue = BASE.revenue.map(v => noise(rand, v * s));
  const cogs = revenue.map(r => noise(rand, r * p.cogsRatio, 0.03));
  const costOfRevenue = cogs.map(v => v); // same as COGS for most companies
  const rd = revenue.map(r => noise(rand, r * p.rdRatio, 0.04));
  const sgaRatio = 0.11 * (1 + (rand() - 0.5) * 0.3);
  const sga = revenue.map(r => noise(rand, r * sgaRatio, 0.06));
  const opEx = rd.map((r, i) => r + sga[i]);
  const totalOpEx = cogs.map((c, i) => c + opEx[i]);
  const opIncome = revenue.map((r, i) => r - totalOpEx[i]);
  const otherIncome = BASE.otherIncome.map(v => noise(rand, v * s, 0.3));
  const ebt = opIncome.map((o, i) => o + otherIncome[i]);
  const taxRateBase = p.netMarginPct > 30 ? 18 : 22;
  const taxRate = [0,1,2,3].map(() => noise(rand, taxRateBase, 0.1));
  const taxExpense = ebt.map((e, i) => e * (taxRate[i] / 100));
  const netIncome = ebt.map((e, i) => e - taxExpense[i]);
  const netMargin = netIncome.map((n, i) => (n / revenue[i]) * 100);
  const eps = BASE.eps.map(v => noise(rand, v * p.epsBase / 3.5, 0.08));
  const ebitda = opIncome.map(o => noise(rand, o * 1.25, 0.05));

  // ─── Balance Sheet ───
  const annualRev = revenue.reduce((a, b) => a + b, 0);
  const totalAssets = [0,1,2,3].map(i =>
    noise(rand, (annualRev * p.assetRatio) * (0.90 + i * 0.035), 0.03)
  );
  const totalLiabilities = totalAssets.map(a => noise(rand, a * p.debtRatio, 0.03));
  const totalEquity = totalAssets.map((a, i) => a - totalLiabilities[i]);
  const cash = totalAssets.map(a => noise(rand, a * 0.05, 0.15));
  const shortTermInv = totalAssets.map(a => noise(rand, a * 0.09, 0.10));
  const totalReceivables = totalAssets.map(a => noise(rand, a * 0.11, 0.08));
  const inventory = totalAssets.map(a => noise(rand, a * 0.002, 0.2));
  const currentAssets = totalAssets.map(a => noise(rand, a * 0.28, 0.05));
  const netPPE = totalAssets.map(a => noise(rand, a * 0.37, 0.04));
  const goodwill = totalAssets.map(a => noise(rand, a * 0.19, 0.01));
  const intangibles = totalAssets.map(a => noise(rand, a * 0.04, 0.05));
  const accountsPayable = totalLiabilities.map(l => noise(rand, l * 0.11, 0.08));
  const longTermDebt = totalLiabilities.map(l => noise(rand, l * 0.14, 0.06));
  const retainedEarnings = totalEquity.map(e => noise(rand, e * 0.68, 0.04));
  const bvps = totalEquity.map(e => noise(rand, e / (7.4e9 * s), 0.03));

  // ─── Cash Flow ───
  const opsFlow = netIncome.map(n => noise(rand, n * 1.35, 0.10));
  const investFlow = opsFlow.map(o => noise(rand, -o * 0.55, 0.20));
  const financeFlow = opsFlow.map(o => noise(rand, -o * 0.35, 0.15));
  const netChange = opsFlow.map((o, i) => o + investFlow[i] + financeFlow[i]);
  const fcf = opsFlow.map(o => noise(rand, o * 0.55, 0.15));
  const repurchase = opsFlow.map(o => noise(rand, -o * 0.15, 0.20));
  const dividends = opsFlow.map(o => noise(rand, -o * 0.18, 0.10));

  // ─── Build sections ───

  const incomeStatement: FinancialSection = {
    quarters,
    chart: [
      { name: "Revenue", data: revenue, color: "blue" },
      { name: "Net income", data: netIncome, color: "lightBlue" },
    ],
    rows: [
      { label: "Revenue", values: revenue.map(v => fmtV(v)) },
      { label: "Cost of goods sold", values: cogs.map(v => fmtV(v)) },
      { label: "Cost of revenue", values: costOfRevenue.map(v => fmtV(v)) },
      { label: "Research and development expenses", values: rd.map(v => fmtV(v)) },
      { label: "Selling, general, and admin expenses", values: sga.map(v => fmtV(v)) },
      { label: "Operating expense", values: opEx.map(v => fmtV(v)) },
      { label: "Total operating expenses", values: totalOpEx.map(v => fmtV(v)) },
      { label: "Operating income", values: opIncome.map(v => fmtV(v)) },
      { label: "Other non operating income", values: otherIncome.map(v => fmtV(v)) },
      { label: "Income tax expense", values: taxExpense.map(v => fmtV(v)) },
      { label: "Effective tax rate", values: taxRate.map(v => fmtPct(v)) },
      { label: "Net income", values: netIncome.map(v => fmtV(v)) },
      { label: "Net profit margin", values: netMargin.map(v => fmtPct(v)) },
      { label: "Earnings per share", values: eps.map(v => fmtEps(v)) },
      { label: "EBITDA", values: ebitda.map(v => fmtV(v)) },
    ],
  };

  const balanceSheet: FinancialSection = {
    quarters,
    chart: [
      { name: "Total assets", data: totalAssets, color: "blue" },
      { name: "Total liabilities", data: totalLiabilities, color: "lightBlue" },
    ],
    rows: [
      { label: "Cash and equivalents", values: cash.map(v => fmtV(v)) },
      { label: "Short term investments", values: shortTermInv.map(v => fmtV(v)) },
      { label: "Total receivables", values: totalReceivables.map(v => fmtV(v)) },
      { label: "Inventory", values: inventory.map(v => fmtV(v)) },
      { label: "Total current assets", values: currentAssets.map(v => fmtV(v)) },
      { label: "Net property plant and equipment", values: netPPE.map(v => fmtV(v)) },
      { label: "Goodwill", values: goodwill.map(v => fmtV(v)) },
      { label: "Total other intangibles", values: intangibles.map(v => fmtV(v)) },
      { label: "Total assets", values: totalAssets.map(v => fmtV(v)) },
      { label: "Total accounts payable", values: accountsPayable.map(v => fmtV(v)) },
      { label: "Long term debt", values: longTermDebt.map(v => fmtV(v)) },
      { label: "Total liabilities", values: totalLiabilities.map(v => fmtV(v)) },
      { label: "Retained earnings", values: retainedEarnings.map(v => fmtV(v)) },
      { label: "Total equity", values: totalEquity.map(v => fmtV(v)) },
      { label: "Book value per share", values: bvps.map(v => fmtEps(v)) },
    ],
  };

  const cashFlowSection: FinancialSection = {
    quarters,
    chart: [
      { name: "Cash from operations", data: opsFlow, color: "blue" },
      { name: "Cash from investing", data: investFlow, color: "red" },
      { name: "Cash from financing", data: financeFlow, color: "amber" },
    ],
    rows: [
      { label: "Net income", values: netIncome.map(v => fmtV(v)) },
      { label: "Cash from operations", values: opsFlow.map(v => fmtV(v)) },
      { label: "Cash from investing", values: investFlow.map(v => fmtV(v)) },
      { label: "Cash from financing", values: financeFlow.map(v => fmtV(v)) },
      { label: "Net change in cash", values: netChange.map(v => fmtV(v)) },
      { label: "Repurchase of common stock", values: repurchase.map(v => fmtV(v)) },
      { label: "Common dividends paid", values: dividends.map(v => fmtV(v)) },
      { label: "Free cash flow", values: fcf.map(v => fmtV(v)) },
    ],
  };

  return {
    incomeStatement,
    balanceSheet,
    cashFlow: cashFlowSection,
  };
}
