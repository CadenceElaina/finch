import React from "react";
import { useQuery } from "@tanstack/react-query";
import { ENDPOINTS, yhFetch } from "../../config/api";
import { isDemoActive } from "../../data/demo/demoState";
import { FaArrowUp, FaArrowDown, FaMinus } from "react-icons/fa";
import "./AnalystRatings.css";

interface GradeEntry {
  epochGradeDate: number;
  firm: string;
  toGrade: string;
  fromGrade: string;
  action: string; // "init" | "main" | "up" | "down" | "reit"
}

const ACTION_META: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  up: {
    label: "Upgrade",
    icon: <FaArrowUp size={10} />,
    cls: "ar-up",
  },
  down: {
    label: "Downgrade",
    icon: <FaArrowDown size={10} />,
    cls: "ar-down",
  },
  main: {
    label: "Maintained",
    icon: <FaMinus size={10} />,
    cls: "ar-main",
  },
  init: {
    label: "Initiated",
    icon: <FaMinus size={10} />,
    cls: "ar-init",
  },
  reit: {
    label: "Reiterated",
    icon: <FaMinus size={10} />,
    cls: "ar-main",
  },
};

const fmtDate = (epoch: number): string => {
  const d = new Date(epoch * 1000);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

/* Demo analyst ratings data */
const DEMO_RATINGS: Record<string, GradeEntry[]> = {
  AAPL: [
    { epochGradeDate: 1740000000, firm: "Morgan Stanley", toGrade: "Overweight", fromGrade: "Equal-Weight", action: "up" },
    { epochGradeDate: 1738200000, firm: "Goldman Sachs", toGrade: "Buy", fromGrade: "Buy", action: "reit" },
    { epochGradeDate: 1736400000, firm: "JP Morgan", toGrade: "Overweight", fromGrade: "Neutral", action: "up" },
    { epochGradeDate: 1734600000, firm: "Barclays", toGrade: "Equal-Weight", fromGrade: "Equal-Weight", action: "main" },
  ],
  MSFT: [
    { epochGradeDate: 1740200000, firm: "Wedbush", toGrade: "Outperform", fromGrade: "Outperform", action: "reit" },
    { epochGradeDate: 1738800000, firm: "UBS", toGrade: "Buy", fromGrade: "Neutral", action: "up" },
    { epochGradeDate: 1737000000, firm: "Bernstein", toGrade: "Outperform", fromGrade: "Outperform", action: "main" },
    { epochGradeDate: 1735200000, firm: "Deutsche Bank", toGrade: "Buy", fromGrade: "Hold", action: "up" },
  ],
  GOOGL: [
    { epochGradeDate: 1740100000, firm: "Mizuho", toGrade: "Buy", fromGrade: "Neutral", action: "up" },
    { epochGradeDate: 1738500000, firm: "Piper Sandler", toGrade: "Overweight", fromGrade: "Overweight", action: "main" },
    { epochGradeDate: 1736900000, firm: "Canaccord", toGrade: "Buy", fromGrade: "Buy", action: "reit" },
  ],
  NVDA: [
    { epochGradeDate: 1740300000, firm: "KeyBanc", toGrade: "Overweight", fromGrade: "Sector Weight", action: "up" },
    { epochGradeDate: 1738900000, firm: "Stifel", toGrade: "Buy", fromGrade: "Buy", action: "reit" },
    { epochGradeDate: 1737100000, firm: "Rosenblatt", toGrade: "Buy", fromGrade: "Buy", action: "main" },
    { epochGradeDate: 1735300000, firm: "BMO Capital", toGrade: "Outperform", fromGrade: "Market Perform", action: "up" },
  ],
  TSLA: [
    { epochGradeDate: 1740100000, firm: "Morgan Stanley", toGrade: "Overweight", fromGrade: "Overweight", action: "main" },
    { epochGradeDate: 1738300000, firm: "Goldman Sachs", toGrade: "Neutral", fromGrade: "Buy", action: "down" },
    { epochGradeDate: 1736500000, firm: "RBC Capital", toGrade: "Sector Perform", fromGrade: "Outperform", action: "down" },
  ],
};

const AnalystRatings: React.FC<{ symbol: string }> = ({ symbol }) => {
  const isDemo = isDemoActive();

  const { data: grades, isLoading } = useQuery<GradeEntry[]>({
    queryKey: ["upgradeDowngrade", symbol],
    queryFn: async () => {
      // Demo mode — return hardcoded ratings, no API call
      if (isDemo) {
        const upper = symbol.toUpperCase();
        return DEMO_RATINGS[upper] ?? DEMO_RATINGS.AAPL ?? [];
      }

      const res = await yhFetch(ENDPOINTS.upgradeDowngrade.path, {
        symbol,
        ...ENDPOINTS.upgradeDowngrade.params,
      });
      const d = res.data;
      // Try multiple response shapes
      const history =
        d?.quoteSummary?.result?.[0]?.upgradeDowngradeHistory?.history ??
        d?.upgradeDowngradeHistory?.history ??
        d?.body?.upgradeDowngradeHistory?.history ??
        [];
      return (history as GradeEntry[]).slice(0, 10); // last 10
    },
    enabled: Boolean(symbol),
    staleTime: ENDPOINTS.upgradeDowngrade.cache.stale,
    gcTime: ENDPOINTS.upgradeDowngrade.cache.gc,
  });

  if (isLoading) return null; // Don't show skeleton — it's supplementary data
  if (!grades || grades.length === 0) return null;

  return (
    <div className="ar-section">
      <h3 className="ar-heading">Analyst Ratings</h3>
      <div className="ar-list">
        {grades.map((g, i) => {
          const meta = ACTION_META[g.action] ?? ACTION_META.main;
          return (
            <div className={`ar-row ${meta.cls}`} key={`${g.firm}-${g.epochGradeDate}-${i}`}>
              <span className="ar-icon">{meta.icon}</span>
              <div className="ar-body">
                <span className="ar-firm">{g.firm}</span>
                <span className="ar-grade">
                  {g.fromGrade && g.fromGrade !== g.toGrade
                    ? `${g.fromGrade} → ${g.toGrade}`
                    : g.toGrade}
                </span>
              </div>
              <div className="ar-meta">
                <span className={`ar-action ${meta.cls}`}>{meta.label}</span>
                <span className="ar-date">{fmtDate(g.epochGradeDate)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnalystRatings;
