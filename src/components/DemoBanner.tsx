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
        background: "rgba(26, 115, 232, 0.15)",
        borderBottom: "1px solid rgba(26, 115, 232, 0.3)",
        color: "rgba(255,255,255,0.8)",
        padding: "5px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        fontSize: "12px",
        fontWeight: 400,
        zIndex: 1000,
        position: "relative",
      }}
    >
      <span style={{ opacity: 0.75 }}>
        📊 Demo data — prices are a frozen snapshot
      </span>
      <button
        onClick={handleExitDemo}
        style={{
          background: "rgba(26, 115, 232, 0.3)",
          border: "1px solid rgba(26, 115, 232, 0.5)",
          color: "rgba(255,255,255,0.9)",
          borderRadius: "4px",
          padding: "2px 8px",
          fontSize: "11px",
          cursor: "pointer",
          fontWeight: 500,
        }}
      >
        Try live data
      </button>
      <button
        onClick={handleDismiss}
        title="Dismiss"
        style={{
          position: "absolute",
          right: "12px",
          background: "transparent",
          border: "none",
          color: "rgba(255,255,255,0.4)",
          cursor: "pointer",
          fontSize: "14px",
          lineHeight: 1,
          padding: "2px 4px",
        }}
      >
        ×
      </button>
    </div>
  );
};

export default DemoBanner;
