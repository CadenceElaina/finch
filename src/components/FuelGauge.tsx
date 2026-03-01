/**
 * FuelGauge — shows remaining daily AI credits.
 * Displays as a compact pill: "⚡ 7 / 10"
 */

import React from "react";
import { useAi } from "../context/AiContext";
import "./FuelGauge.css";

const FuelGauge: React.FC = () => {
  const { creditsRemaining, maxCredits, configured } = useAi();

  if (!configured) return null;

  const pct = (creditsRemaining / maxCredits) * 100;
  const level = pct > 50 ? "high" : pct > 20 ? "medium" : "low";

  return (
    <div className={`fuel-gauge fuel-${level}`} title="Daily AI research credits">
      <span className="fuel-icon">⚡</span>
      <span className="fuel-count">
        {creditsRemaining} / {maxCredits}
      </span>
      <div className="fuel-bar">
        <div className="fuel-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export default FuelGauge;
