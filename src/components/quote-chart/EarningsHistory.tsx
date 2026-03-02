import React from "react";
import { useQuery } from "@tanstack/react-query";
import { saFetch, SA_ENDPOINTS, getSaId } from "../../config/seekingAlphaApi";
import { isDemoActive } from "../../data/demo/demoState";
import { FaCheckCircle, FaTimesCircle, FaCalendarAlt } from "react-icons/fa";
import Skeleton from "@mui/material/Skeleton";
import "./EarningsHistory.css";

/* ── types ── */

interface PeriodInfo {
  periodtypeid: string;
  fiscalquarter: number;
  fiscalyear: number;
  calendarquarter: number;
  calendaryear: number;
  periodenddate: string;
  advancedate: string | null;
}

interface EstimateEntry {
  effectivedate: string;
  dataitemvalue: string;
  period: PeriodInfo;
}

type EstimatesBucket = Record<string, EstimateEntry[]>;

interface SAEarningsResponse {
  estimates: Record<
    string,
    {
      eps_normalized_actual?: EstimatesBucket;
      eps_normalized_consensus_mean?: EstimatesBucket;
      revenue_actual?: EstimatesBucket;
      revenue_consensus_mean?: EstimatesBucket;
    }
  >;
}

interface EarningsQuarter {
  fiscalQuarter: number;
  fiscalYear: number;
  periodEndDate: string;
  reportDate: string | null;
  epsActual: number | null;
  epsEstimate: number | null;
  revenueActual: number | null;
  revenueEstimate: number | null;
}

/* ── Demo data ── */

const DEMO_EARNINGS: Record<string, EarningsQuarter[]> = {
  AAPL: [
    { fiscalQuarter: 1, fiscalYear: 2026, periodEndDate: "2025-12-31", reportDate: "2026-01-29", epsActual: 2.84, epsEstimate: 2.67, revenueActual: 143760000000, revenueEstimate: 138520000000 },
    { fiscalQuarter: 4, fiscalYear: 2025, periodEndDate: "2025-09-30", reportDate: "2025-10-30", epsActual: 1.85, epsEstimate: 1.77, revenueActual: 102470000000, revenueEstimate: 102250000000 },
    { fiscalQuarter: 3, fiscalYear: 2025, periodEndDate: "2025-06-30", reportDate: "2025-07-31", epsActual: 1.57, epsEstimate: 1.43, revenueActual: 94040000000, revenueEstimate: 89160000000 },
    { fiscalQuarter: 2, fiscalYear: 2025, periodEndDate: "2025-03-31", reportDate: "2025-05-01", epsActual: 1.65, epsEstimate: 1.63, revenueActual: 95360000000, revenueEstimate: 94710000000 },
    { fiscalQuarter: 1, fiscalYear: 2025, periodEndDate: "2024-12-31", reportDate: "2025-01-30", epsActual: 2.40, epsEstimate: 2.35, revenueActual: 124300000000, revenueEstimate: 124030000000 },
    { fiscalQuarter: 4, fiscalYear: 2024, periodEndDate: "2024-09-30", reportDate: "2024-10-31", epsActual: 1.64, epsEstimate: 1.60, revenueActual: 94930000000, revenueEstimate: 94420000000 },
    { fiscalQuarter: 3, fiscalYear: 2024, periodEndDate: "2024-06-30", reportDate: "2024-08-01", epsActual: 1.40, epsEstimate: 1.34, revenueActual: 85780000000, revenueEstimate: 84400000000 },
    { fiscalQuarter: 2, fiscalYear: 2024, periodEndDate: "2024-03-31", reportDate: "2024-05-02", epsActual: 1.53, epsEstimate: 1.51, revenueActual: 90750000000, revenueEstimate: 90450000000 },
  ],
  MSFT: [
    { fiscalQuarter: 2, fiscalYear: 2026, periodEndDate: "2025-12-31", reportDate: "2026-01-28", epsActual: 3.35, epsEstimate: 2.73, revenueActual: 69630000000, revenueEstimate: 68780000000 },
    { fiscalQuarter: 1, fiscalYear: 2026, periodEndDate: "2025-09-30", reportDate: "2025-10-29", epsActual: 3.30, epsEstimate: 3.10, revenueActual: 65590000000, revenueEstimate: 64510000000 },
    { fiscalQuarter: 4, fiscalYear: 2025, periodEndDate: "2025-06-30", reportDate: "2025-07-22", epsActual: 2.95, epsEstimate: 2.93, revenueActual: 64730000000, revenueEstimate: 64370000000 },
    { fiscalQuarter: 3, fiscalYear: 2025, periodEndDate: "2025-03-31", reportDate: "2025-04-30", epsActual: 3.46, epsEstimate: 3.22, revenueActual: 70070000000, revenueEstimate: 68440000000 },
    { fiscalQuarter: 2, fiscalYear: 2025, periodEndDate: "2024-12-31", reportDate: "2025-01-29", epsActual: 3.23, epsEstimate: 3.11, revenueActual: 69630000000, revenueEstimate: 68780000000 },
    { fiscalQuarter: 1, fiscalYear: 2025, periodEndDate: "2024-09-30", reportDate: "2024-10-30", epsActual: 3.30, epsEstimate: 3.10, revenueActual: 65590000000, revenueEstimate: 64510000000 },
  ],
  GOOGL: [
    { fiscalQuarter: 4, fiscalYear: 2025, periodEndDate: "2025-12-31", reportDate: "2026-02-04", epsActual: 2.15, epsEstimate: 2.13, revenueActual: 96470000000, revenueEstimate: 96590000000 },
    { fiscalQuarter: 3, fiscalYear: 2025, periodEndDate: "2025-09-30", reportDate: "2025-10-29", epsActual: 2.12, epsEstimate: 1.84, revenueActual: 88270000000, revenueEstimate: 86300000000 },
    { fiscalQuarter: 2, fiscalYear: 2025, periodEndDate: "2025-06-30", reportDate: "2025-07-22", epsActual: 1.89, epsEstimate: 1.85, revenueActual: 84740000000, revenueEstimate: 84290000000 },
    { fiscalQuarter: 1, fiscalYear: 2025, periodEndDate: "2025-03-31", reportDate: "2025-04-24", epsActual: 2.81, epsEstimate: 2.02, revenueActual: 90230000000, revenueEstimate: 89110000000 },
    { fiscalQuarter: 4, fiscalYear: 2024, periodEndDate: "2024-12-31", reportDate: "2025-02-04", epsActual: 2.12, epsEstimate: 2.13, revenueActual: 96470000000, revenueEstimate: 96590000000 },
    { fiscalQuarter: 3, fiscalYear: 2024, periodEndDate: "2024-09-30", reportDate: "2024-10-29", epsActual: 2.12, epsEstimate: 1.84, revenueActual: 88270000000, revenueEstimate: 86300000000 },
  ],
  NVDA: [
    { fiscalQuarter: 4, fiscalYear: 2025, periodEndDate: "2025-01-31", reportDate: "2025-02-26", epsActual: 0.89, epsEstimate: 0.85, revenueActual: 39331000000, revenueEstimate: 38010000000 },
    { fiscalQuarter: 3, fiscalYear: 2025, periodEndDate: "2024-10-31", reportDate: "2024-11-20", epsActual: 0.81, epsEstimate: 0.75, revenueActual: 35082000000, revenueEstimate: 33090000000 },
    { fiscalQuarter: 2, fiscalYear: 2025, periodEndDate: "2024-07-31", reportDate: "2024-08-28", epsActual: 0.68, epsEstimate: 0.64, revenueActual: 30040000000, revenueEstimate: 28680000000 },
    { fiscalQuarter: 1, fiscalYear: 2025, periodEndDate: "2024-04-30", reportDate: "2024-05-22", epsActual: 0.60, epsEstimate: 0.52, revenueActual: 26044000000, revenueEstimate: 24650000000 },
    { fiscalQuarter: 4, fiscalYear: 2024, periodEndDate: "2024-01-31", reportDate: "2024-02-21", epsActual: 0.52, epsEstimate: 0.46, revenueActual: 22103000000, revenueEstimate: 20410000000 },
    { fiscalQuarter: 3, fiscalYear: 2024, periodEndDate: "2023-10-31", reportDate: "2023-11-21", epsActual: 0.40, epsEstimate: 0.35, revenueActual: 18120000000, revenueEstimate: 16110000000 },
  ],
  TSLA: [
    { fiscalQuarter: 4, fiscalYear: 2025, periodEndDate: "2025-12-31", reportDate: "2026-01-29", epsActual: 0.73, epsEstimate: 0.76, revenueActual: 25710000000, revenueEstimate: 27140000000 },
    { fiscalQuarter: 3, fiscalYear: 2025, periodEndDate: "2025-09-30", reportDate: "2025-10-23", epsActual: 0.72, epsEstimate: 0.58, revenueActual: 25180000000, revenueEstimate: 25430000000 },
    { fiscalQuarter: 2, fiscalYear: 2025, periodEndDate: "2025-06-30", reportDate: "2025-07-22", epsActual: 0.52, epsEstimate: 0.46, revenueActual: 25500000000, revenueEstimate: 24770000000 },
    { fiscalQuarter: 1, fiscalYear: 2025, periodEndDate: "2025-03-31", reportDate: "2025-04-22", epsActual: 0.27, epsEstimate: 0.41, revenueActual: 19335000000, revenueEstimate: 21370000000 },
    { fiscalQuarter: 4, fiscalYear: 2024, periodEndDate: "2024-12-31", reportDate: "2025-01-29", epsActual: 0.73, epsEstimate: 0.76, revenueActual: 25710000000, revenueEstimate: 27140000000 },
    { fiscalQuarter: 3, fiscalYear: 2024, periodEndDate: "2024-09-30", reportDate: "2024-10-23", epsActual: 0.72, epsEstimate: 0.58, revenueActual: 25180000000, revenueEstimate: 25430000000 },
  ],
  AMZN: [
    { fiscalQuarter: 4, fiscalYear: 2025, periodEndDate: "2025-12-31", reportDate: "2026-02-06", epsActual: 1.86, epsEstimate: 1.49, revenueActual: 187790000000, revenueEstimate: 187290000000 },
    { fiscalQuarter: 3, fiscalYear: 2025, periodEndDate: "2025-09-30", reportDate: "2025-10-30", epsActual: 1.43, epsEstimate: 1.14, revenueActual: 158880000000, revenueEstimate: 157200000000 },
    { fiscalQuarter: 2, fiscalYear: 2025, periodEndDate: "2025-06-30", reportDate: "2025-07-31", epsActual: 1.26, epsEstimate: 1.03, revenueActual: 148000000000, revenueEstimate: 148560000000 },
    { fiscalQuarter: 1, fiscalYear: 2025, periodEndDate: "2025-03-31", reportDate: "2025-05-01", epsActual: 1.59, epsEstimate: 1.37, revenueActual: 155670000000, revenueEstimate: 155010000000 },
    { fiscalQuarter: 4, fiscalYear: 2024, periodEndDate: "2024-12-31", reportDate: "2025-02-06", epsActual: 1.86, epsEstimate: 1.49, revenueActual: 187790000000, revenueEstimate: 187290000000 },
    { fiscalQuarter: 3, fiscalYear: 2024, periodEndDate: "2024-09-30", reportDate: "2024-10-31", epsActual: 1.43, epsEstimate: 1.14, revenueActual: 158880000000, revenueEstimate: 157200000000 },
  ],
  META: [
    { fiscalQuarter: 4, fiscalYear: 2025, periodEndDate: "2025-12-31", reportDate: "2026-01-29", epsActual: 8.02, epsEstimate: 6.77, revenueActual: 48385000000, revenueEstimate: 46960000000 },
    { fiscalQuarter: 3, fiscalYear: 2025, periodEndDate: "2025-09-30", reportDate: "2025-10-29", epsActual: 6.03, epsEstimate: 5.25, revenueActual: 40590000000, revenueEstimate: 40280000000 },
    { fiscalQuarter: 2, fiscalYear: 2025, periodEndDate: "2025-06-30", reportDate: "2025-07-23", epsActual: 5.31, epsEstimate: 4.73, revenueActual: 39070000000, revenueEstimate: 38310000000 },
    { fiscalQuarter: 1, fiscalYear: 2025, periodEndDate: "2025-03-31", reportDate: "2025-04-30", epsActual: 6.43, epsEstimate: 5.22, revenueActual: 42310000000, revenueEstimate: 41370000000 },
    { fiscalQuarter: 4, fiscalYear: 2024, periodEndDate: "2024-12-31", reportDate: "2025-01-29", epsActual: 8.02, epsEstimate: 6.77, revenueActual: 48385000000, revenueEstimate: 46960000000 },
    { fiscalQuarter: 3, fiscalYear: 2024, periodEndDate: "2024-09-30", reportDate: "2024-10-30", epsActual: 6.03, epsEstimate: 5.25, revenueActual: 40590000000, revenueEstimate: 40280000000 },
  ],
  JPM: [
    { fiscalQuarter: 4, fiscalYear: 2025, periodEndDate: "2025-12-31", reportDate: "2026-01-14", epsActual: 4.81, epsEstimate: 4.11, revenueActual: 43740000000, revenueEstimate: 41780000000 },
    { fiscalQuarter: 3, fiscalYear: 2025, periodEndDate: "2025-09-30", reportDate: "2025-10-15", epsActual: 4.37, epsEstimate: 4.01, revenueActual: 42650000000, revenueEstimate: 41180000000 },
    { fiscalQuarter: 2, fiscalYear: 2025, periodEndDate: "2025-06-30", reportDate: "2025-07-11", epsActual: 4.40, epsEstimate: 4.19, revenueActual: 43080000000, revenueEstimate: 42300000000 },
    { fiscalQuarter: 1, fiscalYear: 2025, periodEndDate: "2025-03-31", reportDate: "2025-04-11", epsActual: 4.44, epsEstimate: 4.61, revenueActual: 44490000000, revenueEstimate: 43490000000 },
  ],
  V: [
    { fiscalQuarter: 1, fiscalYear: 2026, periodEndDate: "2025-12-31", reportDate: "2026-01-30", epsActual: 2.75, epsEstimate: 2.66, revenueActual: 9500000000, revenueEstimate: 9360000000 },
    { fiscalQuarter: 4, fiscalYear: 2025, periodEndDate: "2025-09-30", reportDate: "2025-10-28", epsActual: 2.71, epsEstimate: 2.58, revenueActual: 9620000000, revenueEstimate: 9490000000 },
    { fiscalQuarter: 3, fiscalYear: 2025, periodEndDate: "2025-06-30", reportDate: "2025-07-22", epsActual: 2.51, epsEstimate: 2.42, revenueActual: 8900000000, revenueEstimate: 8810000000 },
    { fiscalQuarter: 2, fiscalYear: 2025, periodEndDate: "2025-03-31", reportDate: "2025-04-29", epsActual: 2.76, epsEstimate: 2.68, revenueActual: 9590000000, revenueEstimate: 9540000000 },
  ],
};

/* ── Helpers ── */

const fmtDate = (dateStr: string): string => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const fmtFiscalPeriod = (q: EarningsQuarter): string =>
  `Q${q.fiscalQuarter} ${q.fiscalYear}`;

const fmtCurrency = (val: number): string => {
  if (Math.abs(val) >= 1e12) return `${(val / 1e12).toFixed(2)}T`;
  if (Math.abs(val) >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
  if (Math.abs(val) >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
  return val.toFixed(2);
};

const surprisePct = (actual: number | null, estimate: number | null): string | null => {
  if (actual == null || estimate == null || estimate === 0) return null;
  const pct = ((actual - estimate) / Math.abs(estimate)) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
};

const isBeat = (actual: number | null, estimate: number | null): boolean | null => {
  if (actual == null || estimate == null) return null;
  return actual > estimate;
};

/* ── Parse SA API response into EarningsQuarter[] ── */

function parseEarningsResponse(data: SAEarningsResponse, tickerId: string): EarningsQuarter[] {
  const idStr = String(tickerId);
  const tickerData = data.estimates?.[idStr];
  if (!tickerData) return [];

  // Merge all periods from actuals and estimates
  const periodMap = new Map<string, EarningsQuarter>();

  const processBucket = (
    bucket: EstimatesBucket | undefined,
    field: keyof EarningsQuarter
  ) => {
    if (!bucket) return;
    for (const [, entries] of Object.entries(bucket)) {
      for (const entry of entries) {
        const p = entry.period;
        const key = `${p.fiscalyear}-Q${p.fiscalquarter}`;
        if (!periodMap.has(key)) {
          periodMap.set(key, {
            fiscalQuarter: p.fiscalquarter,
            fiscalYear: p.fiscalyear,
            periodEndDate: p.periodenddate?.split("T")[0] ?? "",
            reportDate: p.advancedate?.split("T")[0] ?? null,
            epsActual: null,
            epsEstimate: null,
            revenueActual: null,
            revenueEstimate: null,
          });
        }
        const q = periodMap.get(key)!;
        const val = parseFloat(entry.dataitemvalue);
        if (!isNaN(val)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (q as any)[field] = val;
        }
      }
    }
  };

  processBucket(tickerData.eps_normalized_actual, "epsActual");
  processBucket(tickerData.eps_normalized_consensus_mean, "epsEstimate");
  processBucket(tickerData.revenue_actual, "revenueActual");
  processBucket(tickerData.revenue_consensus_mean, "revenueEstimate");

  // Sort by period end date descending (most recent first)
  return Array.from(periodMap.values()).sort(
    (a, b) => new Date(b.periodEndDate).getTime() - new Date(a.periodEndDate).getTime()
  );
}

/* ── Component ── */

interface Props {
  symbol: string;
}

/** Generate plausible demo earnings for symbols not in the hardcoded map */
function generateDemoEarnings(sym: string): EarningsQuarter[] {
  const base = sym.length; // deterministic seed from symbol length
  const now = new Date();
  const quarters: EarningsQuarter[] = [];
  for (let i = 0; i < 6; i++) {
    const qDate = new Date(now);
    qDate.setMonth(qDate.getMonth() - 3 * (i + 1));
    const fy = qDate.getFullYear();
    const fq = Math.floor(qDate.getMonth() / 3) + 1;
    const epsBase = 1.2 + base * 0.15 + i * 0.05;
    const revBase = (8 + base * 2) * 1e9;
    quarters.push({
      fiscalQuarter: fq,
      fiscalYear: fy,
      periodEndDate: qDate.toISOString().split("T")[0],
      reportDate: new Date(qDate.getTime() + 30 * 86400000).toISOString().split("T")[0],
      epsActual: parseFloat((epsBase + (i % 2 === 0 ? 0.12 : -0.03)).toFixed(2)),
      epsEstimate: parseFloat(epsBase.toFixed(2)),
      revenueActual: Math.round(revBase * (1 + (i % 3 === 0 ? 0.04 : -0.02))),
      revenueEstimate: Math.round(revBase),
    });
  }
  return quarters;
}

const EarningsHistory: React.FC<Props> = ({ symbol }) => {
  const saId = getSaId(symbol);

  const { data: quarters, isLoading } = useQuery<EarningsQuarter[]>({
    queryKey: ["earnings-history", symbol],
    queryFn: async () => {
      // Demo mode — return hardcoded or generated data, no API call
      if (isDemoActive()) {
        const upper = symbol.toUpperCase();
        return DEMO_EARNINGS[upper] ?? generateDemoEarnings(upper);
      }

      if (!saId) return [];

      const res = await saFetch(SA_ENDPOINTS.earnings, {
        ticker_ids: String(saId),
        period_type: "quarterly",
        relative_periods: "-4,-3,-2,-1,0,1",
        estimates_data_items:
          "eps_normalized_actual,eps_normalized_consensus_mean,revenue_actual,revenue_consensus_mean",
      });

      return parseEarningsResponse(res.data, String(saId));
    },
    enabled: Boolean(symbol),
    staleTime: 24 * 60 * 60 * 1000, // 24h — earnings don't change often
    gcTime: 48 * 60 * 60 * 1000,
  });

  /* Loading skeleton */
  if (isLoading) {
    return (
      <div className="eh-section">
        <h3 className="eh-heading">Earnings History</h3>
        <div className="eh-skeleton">
          {[...Array(4)].map((_, i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              height={48}
              sx={{ borderRadius: "8px", bgcolor: "var(--bg-secondary)" }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!quarters || quarters.length === 0) return null;

  // Separate the most recent reported quarter (has actual data) for the hero card
  const reported = quarters.filter((q) => q.epsActual != null);
  const lastReported = reported[0] ?? null;
  const previousReports = reported.slice(1);

  return (
    <div className="eh-section">
      <h3 className="eh-heading">Earnings History</h3>

      {/* ── Hero card for last report ── */}
      {lastReported && (
        <div className="eh-hero">
          <div className="eh-hero-header">
            <div className="eh-hero-period">
              <FaCalendarAlt size={12} className="eh-hero-icon" />
              <span className="eh-hero-label">Last Report</span>
            </div>
            <div className="eh-hero-meta">
              <span className="eh-hero-date">
                {lastReported.reportDate ? fmtDate(lastReported.reportDate) : "—"}
              </span>
              <span className="eh-hero-fiscal">{fmtFiscalPeriod(lastReported)}</span>
            </div>
          </div>

          <div className="eh-hero-grid">
            {/* EPS */}
            <div className="eh-hero-metric">
              <span className="eh-hero-metric-label">Normalized EPS / Estimate</span>
              <div className="eh-hero-metric-row">
                <span className="eh-hero-metric-value">
                  {lastReported.epsActual?.toFixed(2) ?? "—"}
                  {lastReported.epsEstimate != null && (
                    <span className="eh-hero-est">
                      {" "}/ ({lastReported.epsEstimate.toFixed(2)} est.)
                    </span>
                  )}
                </span>
                {(() => {
                  const pct = surprisePct(lastReported.epsActual, lastReported.epsEstimate);
                  const beat = isBeat(lastReported.epsActual, lastReported.epsEstimate);
                  if (pct == null || beat == null) return null;
                  return (
                    <span className={`eh-surprise ${beat ? "eh-beat" : "eh-miss"}`}>
                      {beat ? <FaCheckCircle size={10} /> : <FaTimesCircle size={10} />}
                      {pct} {beat ? "beat" : "miss"}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Revenue */}
            <div className="eh-hero-metric">
              <span className="eh-hero-metric-label">Revenue / Estimate</span>
              <div className="eh-hero-metric-row">
                <span className="eh-hero-metric-value">
                  {lastReported.revenueActual != null ? fmtCurrency(lastReported.revenueActual) : "—"}
                  {lastReported.revenueEstimate != null && (
                    <span className="eh-hero-est">
                      {" "}/ ({fmtCurrency(lastReported.revenueEstimate)} est.)
                    </span>
                  )}
                </span>
                {(() => {
                  const pct = surprisePct(lastReported.revenueActual, lastReported.revenueEstimate);
                  const beat = isBeat(lastReported.revenueActual, lastReported.revenueEstimate);
                  if (pct == null || beat == null) return null;
                  return (
                    <span className={`eh-surprise ${beat ? "eh-beat" : "eh-miss"}`}>
                      {beat ? <FaCheckCircle size={10} /> : <FaTimesCircle size={10} />}
                      {pct} {beat ? "beat" : "miss"}
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Previous reports table ── */}
      {previousReports.length > 0 && (
        <div className="eh-table-wrap">
          <h4 className="eh-sub-heading">Previous Reports</h4>
          <table className="eh-table">
            <thead>
              <tr>
                <th>Fiscal Period</th>
                <th>Report Date</th>
                <th>Normalized EPS</th>
                <th>Revenue</th>
                <th>EPS Surprise</th>
                <th>Rev. Surprise</th>
              </tr>
            </thead>
            <tbody>
              {previousReports.map((q) => {
                const epsPct = surprisePct(q.epsActual, q.epsEstimate);
                const revPct = surprisePct(q.revenueActual, q.revenueEstimate);
                const epsBeat = isBeat(q.epsActual, q.epsEstimate);
                const revBeat = isBeat(q.revenueActual, q.revenueEstimate);

                return (
                  <tr key={`${q.fiscalYear}-${q.fiscalQuarter}`}>
                    <td className="eh-cell-period">{fmtFiscalPeriod(q)}</td>
                    <td>{q.reportDate ? fmtDate(q.reportDate) : "—"}</td>
                    <td>
                      {q.epsActual?.toFixed(2) ?? "—"}
                      {q.epsEstimate != null && (
                        <span className="eh-est"> / ({q.epsEstimate.toFixed(2)} est.)</span>
                      )}
                    </td>
                    <td>
                      {q.revenueActual != null ? fmtCurrency(q.revenueActual) : "—"}
                      {q.revenueEstimate != null && (
                        <span className="eh-est"> / ({fmtCurrency(q.revenueEstimate)} est.)</span>
                      )}
                    </td>
                    <td>
                      {epsPct != null ? (
                        <span className={epsBeat ? "eh-beat" : "eh-miss"}>
                          {epsBeat ? <FaCheckCircle size={9} /> : <FaTimesCircle size={9} />}
                          {" "}{epsPct}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      {revPct != null ? (
                        <span className={revBeat ? "eh-beat" : "eh-miss"}>
                          {revBeat ? <FaCheckCircle size={9} /> : <FaTimesCircle size={9} />}
                          {" "}{revPct}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EarningsHistory;
