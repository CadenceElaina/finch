/**
 * DemoBanner — persistent top banner shown when the app is in demo mode.
 * Displays a message and a "Try live data" button to exit demo mode.
 */

import React, { useState } from "react";
import { useDemoMode } from "../context/DemoModeContext";

const DISMISSED_KEY = "finch_demo_banner_dismissed";

const DemoBanner: React.FC = () => {
  const { isDemoMode, exitDemoMode } = useDemoMode();
  // Use sessionStorage so banner hides for the session but shows on fresh load
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(DISMISSED_KEY) === "1"
  );

  if (!isDemoMode || dismissed) return null;

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  };

  const handleExitDemo = () => {
    exitDemoMode();
    setTimeout(() => window.location.assign("/"), 150);
  };

  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border)",
        color: "var(--text-secondary)",
        padding: "6px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        fontSize: "0.78rem",
        fontWeight: 400,
        zIndex: 1000,
        position: "relative",
      }}
    >
      <span>
        📊 Demo data — prices are a frozen snapshot
      </span>
      <button
        onClick={handleExitDemo}
        style={{
          background: "var(--blue)",
          border: "none",
          color: "#fff",
          borderRadius: "4px",
          padding: "3px 10px",
          fontSize: "0.72rem",
          cursor: "pointer",
          fontWeight: 600,
          letterSpacing: "0.02em",
        }}
      >
        Try live data
      </button>
    </div>
  );
};

export default DemoBanner;
