/**
 * Sparkline — tiny inline SVG chart.
 * Generates a deterministic pseudo-random path from a seed (symbol hash)
 * so each stock gets a unique but stable mini-chart.
 * Color matches gain/loss direction.
 */

import React from "react";

interface SparklineProps {
  up: boolean;
  /** Optional seed string (e.g. symbol) for varied look per stock */
  seed?: string;
  /** Width in px (default 50) */
  width?: number;
  /** Height in px (default 16) */
  height?: number;
}

/** Simple string hash → number */
const hashStr = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

/**
 * Build an SVG polyline path with `points` segments.
 * Uses a seeded pseudo-random walk that respects the up/down direction.
 */
const buildPath = (
  up: boolean,
  w: number,
  h: number,
  seed: number,
  points = 12
): string => {
  const pad = 2;
  const usableH = h - pad * 2;
  // Start and end bias
  const startY = up ? usableH * 0.75 : usableH * 0.25;
  const endY = up ? usableH * 0.2 : usableH * 0.8;

  const coords: string[] = [];
  for (let i = 0; i <= points; i++) {
    const t = i / points;
    const x = (w * i) / points;
    const base = startY + (endY - startY) * t;
    // Two sine waves at different frequencies seeded per-symbol
    const n1 = Math.sin(i * 2.1 + seed * 0.37) * usableH * 0.22;
    const n2 = Math.sin(i * 3.7 + seed * 0.13) * usableH * 0.12;
    const y = Math.max(pad, Math.min(h - pad, base + n1 + n2 + pad));
    coords.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return `M${coords.join(" L")}`;
};

const Sparkline: React.FC<SparklineProps> = ({
  up,
  seed = "",
  width = 50,
  height = 16,
}) => {
  const color = up ? "var(--positive)" : "var(--negative)";
  const s = seed ? hashStr(seed) : 42;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="qlc-sparkline"
      style={{ display: "block" }}
    >
      <path
        d={buildPath(up, width, height, s)}
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
