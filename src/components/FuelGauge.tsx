/**
 * FuelGauge — shows remaining daily AI credits.
 * Displays as a compact pill: "⚡ 7 / 10"
 * Shows info icon at 0 credits with tooltip about reset.
 */

import React from "react";
import { useAi } from "../context/AiContext";
import { FaInfoCircle } from "react-icons/fa";
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
      {creditsRemaining <= 0 && (
        <span className="fuel-info" title="Resets at midnight">
          <FaInfoCircle size={11} />
        </span>
      )}
      <div className="fuel-bar">
        <div className="fuel-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export default FuelGauge;
