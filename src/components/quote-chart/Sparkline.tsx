/**
 * Sparkline — tiny inline SVG chart used in the lists column.
 * Shows a simple decorative mini-chart (no real data needed).
 * Color matches gain/loss direction.
 */

import React from "react";

interface SparklineProps {
  up: boolean;
}

/**
 * Generates a simple pseudo-random sparkline path.
 * The trend direction ensures the line ends higher/lower than it starts.
 */
const Sparkline: React.FC<SparklineProps> = ({ up }) => {
  const color = up ? "var(--positive)" : "var(--negative)";

  // Simple fixed path that looks like a mini stock chart
  const upPath = "M0,14 L5,12 L10,13 L15,10 L20,11 L25,8 L30,9 L35,6 L40,7 L45,4 L50,3";
  const downPath = "M0,3 L5,5 L10,4 L15,7 L20,6 L25,9 L30,8 L35,11 L40,10 L45,13 L50,14";

  return (
    <svg
      width="50"
      height="16"
      viewBox="0 0 50 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="qlc-sparkline"
    >
      <path
        d={up ? upPath : downPath}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
};

export default Sparkline;
