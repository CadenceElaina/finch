/**
 * DemoBanner — persistent top banner shown when the app is in demo mode.
 * Displays a message and a "Try live data" button to exit demo mode.
 */

import React from "react";
import { useDemoMode } from "../context/DemoModeContext";

const DemoBanner: React.FC = () => {
  const { isDemoMode, exitDemoMode } = useDemoMode();

  if (!isDemoMode) return null;

  return (
    <div
      style={{
        background: "linear-gradient(90deg, #1a73e8 0%, #4285f4 100%)",
        color: "#fff",
        padding: "8px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        fontSize: "13px",
        fontWeight: 500,
        zIndex: 1000,
        position: "relative",
      }}
    >
      <span style={{ opacity: 0.9 }}>
        📊 Viewing demo data — prices are a frozen snapshot
      </span>
      <button
        onClick={exitDemoMode}
        style={{
          background: "rgba(255,255,255,0.2)",
          border: "1px solid rgba(255,255,255,0.4)",
          color: "#fff",
          borderRadius: "4px",
          padding: "3px 10px",
          fontSize: "12px",
          cursor: "pointer",
          fontWeight: 500,
        }}
      >
        Try live data
      </button>
    </div>
  );
};

export default DemoBanner;
