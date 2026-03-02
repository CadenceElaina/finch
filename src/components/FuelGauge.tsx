/**
 * FuelGauge — shows remaining daily AI credits.
 * Displays as a clean compact pill with progress bar.
 * Shows info icon at 0 credits with tooltip about reset.
 */

import React from "react";
import { useAi } from "../context/AiContext";
import { BsStars } from "react-icons/bs";
import { FaInfoCircle } from "react-icons/fa";
import "./FuelGauge.css";

const FuelGauge: React.FC = () => {
  const { creditsRemaining, maxCredits, configured } = useAi();

  if (!configured) return null;

  const pct = (creditsRemaining / maxCredits) * 100;
  const level = pct > 50 ? "high" : pct > 20 ? "medium" : "low";

  return (
    <div className={`fuel-gauge fuel-${level}`}>
      <BsStars size={13} className="fuel-icon" />
      <span className="fuel-count">
        {creditsRemaining}/{maxCredits}
      </span>
      {creditsRemaining <= 0 && (
        <span className="fuel-info" title="Resets at midnight">
          <FaInfoCircle size={10} />
        </span>
      )}
      <div className="fuel-bar">
        <div className="fuel-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="fuel-tooltip">
        <strong>AI Research Credits</strong>
        <span>{creditsRemaining} of {maxCredits} daily credits remaining.</span>
        <span>Use credits to get AI-powered stock analysis, portfolio commentary, and market insights.</span>
        <span>Credits reset at midnight.</span>
      </div>
    </div>
  );
};

export default FuelGauge;
