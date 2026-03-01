/**
 * Shared formatting utilities for Finch.
 * All currency / number / percent display should go through these helpers
 * so the app looks consistent everywhere.
 */

/**
 * Format a number as USD currency: $1,234.56
 * Returns "—" for null/undefined/NaN.
 */
export function formatCurrency(
  value: number | null | undefined,
  decimals = 2
): string {
  if (value == null || isNaN(value)) return "—";
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a number with commas: 1,234,567.89
 * Useful for volume, market cap raw numbers, etc.
 */
export function formatNumber(
  value: number | null | undefined,
  decimals = 2
): string {
  if (value == null || isNaN(value)) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a percent change with sign: +2.24% or -1.05%
 * Returns "—" for null/undefined/NaN.
 */
export function formatPercent(
  value: number | null | undefined,
  decimals = 2
): string {
  if (value == null || isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format a price change with sign and $: +$8.98 or -$8.98
 */
export function formatPriceChange(
  value: number | null | undefined,
  decimals = 2
): string {
  if (value == null || isNaN(value)) return "—";
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  if (value > 0) return `+$${formatted}`;
  if (value < 0) return `-$${formatted}`;
  return "$0.00";
}

/**
 * Format large numbers into human-readable strings: 2.92T, 41.58M, etc.
 */
export function formatLargeNumber(
  value: number | null | undefined
): string {
  if (value == null || isNaN(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return formatNumber(value, 2);
}
