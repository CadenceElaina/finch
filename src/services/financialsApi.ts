/**
 * Finch — Live Financial Statements via Seeking Alpha API
 * ──────────────────────────────────────────────────────────
 * Fetches quarterly income statement, balance sheet, and cash flow
 * using  GET /symbols/get-financials  (3 parallel calls).
 *
 * Results are transformed into the same StockFinancials shape used
 * by the demo generator so Financials.tsx works unchanged.
 *
 * Caching: 24 h via readCachedModule / writeCachedModule (localStorage).
 */

import { saFetch, SA_ENDPOINTS } from "../config/seekingAlphaApi";
import { readCachedModule, writeCachedModule } from "../config/api";
import type {
  StockFinancials,
  FinancialSection,
  FinancialRow,
  ChartSeries,
} from "../data/demo/financials";

// ── SA response typing ───────────────────────────────────

interface SAFundamentalItem {
  id: string;
  type: string; // "fundamentals"
  attributes: {
    year: number;
    quarter: number;
    field: string; // e.g. "total_revenue"
    value: number;
    period_end_date: string; // e.g. "2024-09-28T00:00:00.000-04:00"
  };
  meta?: { is_fiscal?: boolean };
}

interface SAFinancialsResponse {
  data: SAFundamentalItem[];
}

// ── Field → display-label maps ───────────────────────────

const INCOME_FIELDS: Record<string, string> = {
  total_revenue: "Revenue",
  cost_of_goods_sold: "Cost of goods sold",
  cost_of_revenue: "Cost of revenue",
  gross_profit: "Gross profit",
  research_and_development: "Research and development expenses",
  research_development: "Research and development expenses",
  selling_general_and_administrative: "Selling, general, and admin expenses",
  selling_general_admin: "Selling, general, and admin expenses",
  operating_expense: "Operating expense",
  total_operating_expense: "Total operating expenses",
  total_operating_expenses: "Total operating expenses",
  operating_income: "Operating income",
  other_income: "Other non operating income",
  other_income_expense: "Other non operating income",
  interest_expense: "Interest expense",
  pretax_income: "Pre-tax income",
  income_tax: "Income tax expense",
  income_tax_expense: "Income tax expense",
  tax_provision: "Income tax expense",
  net_income: "Net income",
  net_income_continuous_operations: "Net income",
  net_income_common_stockholders: "Net income to common",
  ebitda: "EBITDA",
  basic_eps: "Earnings per share (basic)",
  diluted_eps: "Earnings per share (diluted)",
  eps: "Earnings per share",
  earnings_per_share: "Earnings per share",
};

const BALANCE_FIELDS: Record<string, string> = {
  cash_and_equivalents: "Cash and equivalents",
  cash_and_cash_equivalents: "Cash and equivalents",
  short_term_investments: "Short term investments",
  total_receivables: "Total receivables",
  accounts_receivable: "Total receivables",
  inventory: "Inventory",
  inventories: "Inventory",
  total_current_assets: "Total current assets",
  current_assets: "Total current assets",
  net_ppe: "Net property plant and equipment",
  property_plant_equipment: "Net property plant and equipment",
  goodwill: "Goodwill",
  intangible_assets: "Total other intangibles",
  other_intangible_assets: "Total other intangibles",
  total_assets: "Total assets",
  accounts_payable: "Total accounts payable",
  total_accounts_payable: "Total accounts payable",
  long_term_debt: "Long term debt",
  total_liabilities: "Total liabilities",
  total_stockholders_equity: "Total equity",
  stockholders_equity: "Total equity",
  total_equity: "Total equity",
  retained_earnings: "Retained earnings",
};

const CASHFLOW_FIELDS: Record<string, string> = {
  operating_cash_flow: "Cash from operations",
  cash_from_operations: "Cash from operations",
  investing_cash_flow: "Cash from investing",
  cash_from_investing: "Cash from investing",
  financing_cash_flow: "Cash from financing",
  cash_from_financing: "Cash from financing",
  net_change_in_cash: "Net change in cash",
  free_cash_flow: "Free cash flow",
  capital_expenditure: "Capital expenditure",
  capital_expenditures: "Capital expenditure",
  repurchase_of_stock: "Repurchase of common stock",
  stock_repurchase: "Repurchase of common stock",
  common_stock_repurchased: "Repurchase of common stock",
  dividends_paid: "Common dividends paid",
  common_dividends: "Common dividends paid",
  cash_dividends_paid: "Common dividends paid",
};

// ── Helpers ──────────────────────────────────────────────

/** Convert snake_case to Title Case as a fallback label. */
function snakeToTitle(s: string): string {
  return s
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Format a raw number for display in the table. */
function fmtV(val: number): string {
  const abs = Math.abs(val);
  const sign = val < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(2)}K`;
  if (abs === 0) return "-";
  return val.toFixed(2);
}

/** Format quarter label: year + quarter → "Mar 2024" style. */
function quarterLabel(year: number, quarter: number): string {
  const MONTHS = ["", "Mar", "Jun", "Sep", "Dec"]; // Q1=Mar, Q2=Jun, etc.
  return `${MONTHS[quarter] ?? `Q${quarter}`} ${year}`;
}

// ── Build a FinancialSection from raw SA data ────────────

function buildSection(
  items: SAFundamentalItem[],
  fieldMap: Record<string, string>,
  chartConfig: { fields: string[]; labels: string[]; colors: string[] }
): FinancialSection {
  if (items.length === 0) {
    return { quarters: [], rows: [], chart: [] };
  }

  // 1. Group by (year, quarter) to identify unique quarters
  const quarterMap = new Map<string, { year: number; quarter: number }>();
  for (const item of items) {
    const { year, quarter } = item.attributes;
    const key = `${year}-${quarter}`;
    if (!quarterMap.has(key)) {
      quarterMap.set(key, { year, quarter });
    }
  }

  // Sort quarters chronologically, take last 4
  const sortedQuarters = Array.from(quarterMap.values())
    .sort((a, b) => a.year - b.year || a.quarter - b.quarter)
    .slice(-4);

  const quarterKeys = sortedQuarters.map(
    (q) => `${q.year}-${q.quarter}`
  );
  const quarterLabels = sortedQuarters.map((q) =>
    quarterLabel(q.year, q.quarter)
  );

  // 2. Build field → quarter → value lookup
  const fieldData = new Map<string, Map<string, number>>();
  for (const item of items) {
    const { year, quarter, field, value } = item.attributes;
    const qKey = `${year}-${quarter}`;
    if (!quarterKeys.includes(qKey)) continue; // outside last 4 quarters
    if (!fieldData.has(field)) fieldData.set(field, new Map());
    fieldData.get(field)!.set(qKey, value);
  }

  // 3. Build rows — known fields first (in order), then remaining
  const rows: FinancialRow[] = [];
  const usedFields = new Set<string>();

  // Add known fields in display order
  for (const [saField, label] of Object.entries(fieldMap)) {
    if (!fieldData.has(saField)) continue;
    if (usedFields.has(saField)) continue;
    usedFields.add(saField);

    const vals = fieldData.get(saField)!;
    rows.push({
      label,
      values: quarterKeys.map((qk) => {
        const v = vals.get(qk);
        return v !== undefined ? fmtV(v) : "-";
      }),
    });
  }

  // Add any remaining unknown fields
  for (const [saField, vals] of fieldData) {
    if (usedFields.has(saField)) continue;
    rows.push({
      label: snakeToTitle(saField),
      values: quarterKeys.map((qk) => {
        const v = vals.get(qk);
        return v !== undefined ? fmtV(v) : "-";
      }),
    });
  }

  // 4. Build chart series
  const chart: ChartSeries[] = [];
  for (let i = 0; i < chartConfig.fields.length; i++) {
    // Try to find the field in our data — check exact match and common aliases
    const target = chartConfig.fields[i];
    let vals = fieldData.get(target);

    // If not found by the primary key, try finding by label match in fieldMap
    if (!vals) {
      for (const [saField] of fieldData) {
        if (
          fieldMap[saField] === chartConfig.labels[i] ||
          saField.includes(target)
        ) {
          vals = fieldData.get(saField);
          break;
        }
      }
    }

    if (vals) {
      chart.push({
        name: chartConfig.labels[i],
        data: quarterKeys.map((qk) => vals!.get(qk) ?? 0),
        color: chartConfig.colors[i],
      });
    }
  }

  return { quarters: quarterLabels, rows, chart };
}

// ── Chart configuration per section ─────────────────────

const INCOME_CHART = {
  fields: ["total_revenue", "net_income"],
  labels: ["Revenue", "Net income"],
  colors: ["blue", "lightBlue"],
};

const BALANCE_CHART = {
  fields: ["total_assets", "total_liabilities"],
  labels: ["Total assets", "Total liabilities"],
  colors: ["blue", "lightBlue"],
};

const CASHFLOW_CHART = {
  fields: ["operating_cash_flow", "investing_cash_flow", "financing_cash_flow"],
  labels: [
    "Cash from operations",
    "Cash from investing",
    "Cash from financing",
  ],
  colors: ["blue", "red", "amber"],
};

// ── Public API ───────────────────────────────────────────

const CACHE_MODULE = "financials_sa";

/**
 * Fetch quarterly financial statements for a stock from Seeking Alpha.
 * Returns cached data if available (24 h TTL).
 * Falls back to null on error (caller should use demo data).
 */
export async function fetchFinancials(
  symbol: string
): Promise<StockFinancials | null> {
  // 1. Check localStorage cache
  const cached = readCachedModule<StockFinancials>(symbol, CACHE_MODULE);
  if (cached) return cached;

  try {
    // 2. Fetch all 3 statement types in parallel
    const [incomeRes, balanceRes, cashflowRes] = await Promise.all([
      saFetch(SA_ENDPOINTS.financials, {
        symbol: symbol.toLowerCase(),
        target_currency: "USD",
        period_type: "quarterly",
        statement_type: "income-statement",
      }),
      saFetch(SA_ENDPOINTS.financials, {
        symbol: symbol.toLowerCase(),
        target_currency: "USD",
        period_type: "quarterly",
        statement_type: "balance-sheet",
      }),
      saFetch(SA_ENDPOINTS.financials, {
        symbol: symbol.toLowerCase(),
        target_currency: "USD",
        period_type: "quarterly",
        statement_type: "cash-flow-statement",
      }),
    ]);

    const incomeData: SAFinancialsResponse = incomeRes.data ?? { data: [] };
    const balanceData: SAFinancialsResponse = balanceRes.data ?? { data: [] };
    const cashflowData: SAFinancialsResponse = cashflowRes.data ?? {
      data: [],
    };

    // 3. Build sections
    const incomeStatement = buildSection(
      incomeData.data ?? [],
      INCOME_FIELDS,
      INCOME_CHART
    );
    const balanceSheet = buildSection(
      balanceData.data ?? [],
      BALANCE_FIELDS,
      BALANCE_CHART
    );
    const cashFlow = buildSection(
      cashflowData.data ?? [],
      CASHFLOW_FIELDS,
      CASHFLOW_CHART
    );

    // 4. If we got no data at all, return null so caller can fallback
    const totalRows =
      incomeStatement.rows.length +
      balanceSheet.rows.length +
      cashFlow.rows.length;
    if (totalRows === 0) {
      console.warn(
        `[Finch] SA get-financials returned no data for ${symbol}`
      );
      return null;
    }

    const result: StockFinancials = {
      incomeStatement,
      balanceSheet,
      cashFlow,
    };

    // 5. Cache for 24 h
    writeCachedModule(symbol, CACHE_MODULE, result);

    return result;
  } catch (err) {
    console.warn(`[Finch] Failed to fetch financials for ${symbol}:`, err);
    return null;
  }
}
