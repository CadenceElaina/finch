/**
 * QuoteChartLW — Lightweight Charts (TradingView) based chart
 * ────────────────────────────────────────────────────────────
 * Supports Area (line) and Candlestick modes with optional
 * volume histogram overlay.
 */

import React, { useEffect, useRef, useMemo, useCallback } from "react";
import {
  createChart,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type SeriesType,
  type UTCTimestamp,
  CrosshairMode,
} from "lightweight-charts";
import { useQuery } from "@tanstack/react-query";
import { ENDPOINTS, yhFetch, getQuoteRefreshInterval } from "../../config/api";
import { queryClient } from "./quoteQueryClient";
import { isDemoActive } from "../../data/demo/demoState";
import { useTheme } from "../../context/ThemeContext";
import "./QuoteChart.css";

// ── Types ────────────────────────────────────────────────

export type ChartMode = "area" | "candle";

interface OHLCVPoint {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ── Period → API interval mapping ────────────────────────

function periodToParams(period: string): { interval: string; limit: number } {
  switch (period) {
    case "1D":  return { interval: "5m", limit: 640 };
    case "5D":  return { interval: "15m", limit: 640 };
    case "1M":  return { interval: "1d", limit: 30 };
    case "6M":  return { interval: "1d", limit: 180 };
    case "YTD": return { interval: "1d", limit: 365 };
    case "1Y":  return { interval: "1d", limit: 365 };
    case "5Y":  return { interval: "1wk", limit: 260 };
    case "MAX": return { interval: "1mo", limit: 600 };
    default:    return { interval: "1d", limit: 30 };
  }
}

// ── Demo OHLCV generator ─────────────────────────────────

const STOCK_BASES: Record<string, number> = {
  AAPL: 241.84, MSFT: 415.60, GOOGL: 185.43, TSLA: 338.59,
  NVDA: 131.28, AMZN: 216.20, META: 676.10, JPM: 268.44,
  V: 342.90, WMT: 97.84, AMD: 113.72, NFLX: 1028.35,
  CRM: 308.40, INTC: 24.38, BA: 178.92, UBER: 72.48,
  SHOP: 118.25, COST: 1005.32,
  SPY: 685.99, QQQ: 607.29, VOO: 630.50, VTI: 295.80,
  SCHG: 30.74, VXUS: 83.81, VO: 306.20, VB: 277.11,
  CGGR: 43.17, IAU: 99.07,
};

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashSymbol(sym: string): number {
  let h = 0;
  for (let i = 0; i < sym.length; i++) h = ((h << 5) - h + sym.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function generateDemoOHLCV(symbol: string, period: string): OHLCVPoint[] {
  const upper = symbol.toUpperCase().replace("^", "");
  const base = STOCK_BASES[upper] ?? 100;
  const rand = seededRandom(hashSymbol(upper) + hashSymbol(period));
  const avgVol = base > 500 ? 2_000_000 : base > 100 ? 5_000_000 : 15_000_000;

  const now = new Date(2026, 1, 28, 16, 0); // Feb 28, 2026 4PM
  const points: OHLCVPoint[] = [];

  let intervals: { start: Date; step: number; count: number };
  let volatility: number;
  let priceOffset: number;

  switch (period) {
    case "1D": {
      const dayStart = new Date(2026, 1, 28, 9, 30);
      intervals = { start: dayStart, step: 5 * 60, count: 78 }; // 5-min bars
      volatility = 0.003;
      priceOffset = 0;
      break;
    }
    case "5D": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      d.setHours(9, 30, 0, 0);
      intervals = { start: d, step: 15 * 60, count: 130 };
      volatility = 0.005;
      priceOffset = -0.01;
      break;
    }
    case "1M": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      intervals = { start: d, step: 86400, count: 22 };
      volatility = 0.015;
      priceOffset = -0.02;
      break;
    }
    case "6M": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 6);
      intervals = { start: d, step: 86400, count: 130 };
      volatility = 0.02;
      priceOffset = -0.05;
      break;
    }
    case "YTD": {
      const d = new Date(2026, 0, 2);
      intervals = { start: d, step: 86400, count: 58 };
      volatility = 0.015;
      priceOffset = -0.03;
      break;
    }
    case "1Y": {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      intervals = { start: d, step: 86400, count: 252 };
      volatility = 0.02;
      priceOffset = -0.08;
      break;
    }
    case "5Y": {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 5);
      intervals = { start: d, step: 7 * 86400, count: 260 };
      volatility = 0.04;
      priceOffset = -0.20;
      break;
    }
    case "MAX": {
      const d = new Date(2006, 0, 1);
      intervals = { start: d, step: 30 * 86400, count: 242 };
      volatility = 0.06;
      priceOffset = -0.50;
      break;
    }
    default: {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      intervals = { start: d, step: 86400, count: 22 };
      volatility = 0.015;
      priceOffset = -0.02;
    }
  }

  let price = base * (1 + priceOffset);
  const target = base;
  const step = (target - price) / intervals.count;
  const isIntraday = period === "1D" || period === "5D";

  for (let i = 0; i < intervals.count; i++) {
    const d = new Date(intervals.start.getTime() + i * intervals.step * 1000);

    // Skip weekends for non-intraday
    if (!isIntraday && (d.getDay() === 0 || d.getDay() === 6)) continue;
    // For 5D, skip weekends
    if (period === "5D" && (d.getDay() === 0 || d.getDay() === 6)) continue;

    const noise = (Math.sin(i * 0.8 + rand() * 3) + Math.cos(i * 0.3 + rand() * 2));
    const drift = (rand() - 0.48) * volatility * base * 0.02;
    price += step + noise * volatility * base * 0.05 * 0.3 + drift;
    price = Math.max(price, base * 0.1); // floor

    const bodyRange = price * volatility * (0.3 + rand() * 0.7);
    const isGreen = rand() > 0.45;
    const open = isGreen ? price - bodyRange * 0.5 : price + bodyRange * 0.5;
    const close = isGreen ? price + bodyRange * 0.5 : price - bodyRange * 0.5;
    const high = Math.max(open, close) + price * volatility * rand() * 0.5;
    const low = Math.min(open, close) - price * volatility * rand() * 0.5;
    const volume = Math.round(avgVol * (0.5 + rand()));

    const ts = Math.floor(d.getTime() / 1000) as UTCTimestamp;
    points.push({
      time: ts,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
    });
  }

  return points;
}

// ── Component ────────────────────────────────────────────

interface QuoteChartLWProps {
  interval: string;
  symbol: string;
  previousClosePrice: string;
  chartMode: ChartMode;
  showVolume: boolean;
}

const QuoteChartLW: React.FC<QuoteChartLWProps> = ({
  interval,
  symbol,
  previousClosePrice,
  chartMode,
  showVolume,
}) => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<SeriesType> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<SeriesType> | null>(null);

  const prevClose = parseFloat(previousClosePrice?.replace("$", "") || "0");

  const colors = useMemo(() => ({
    positive: isLight ? "#137333" : "#81c995",
    negative: isLight ? "#c5221f" : "#f28b82",
    positiveArea: isLight ? "rgba(19, 115, 51, 0.08)" : "rgba(129, 201, 149, 0.12)",
    negativeArea: isLight ? "rgba(197, 34, 31, 0.08)" : "rgba(255, 0, 0, 0.12)",
    bg: isLight ? "#ffffff" : "transparent",
    text: isLight ? "#5f6368" : "#9aa0a6",
    grid: isLight ? "rgba(0, 0, 0, 0.06)" : "rgba(255, 255, 255, 0.06)",
    crosshair: isLight ? "#5f6368" : "#9aa0a6",
    volumeUp: isLight ? "rgba(19, 115, 51, 0.25)" : "rgba(129, 201, 149, 0.25)",
    volumeDown: isLight ? "rgba(197, 34, 31, 0.25)" : "rgba(242, 139, 130, 0.25)",
  }), [isLight]);

  // ── Data fetching ──

  const fetchOHLCV = useCallback(async (): Promise<OHLCVPoint[]> => {
    if (isDemoActive()) {
      return generateDemoOHLCV(symbol, interval);
    }

    const { interval: apiInterval, limit } = periodToParams(interval);

    try {
      const response = await yhFetch(ENDPOINTS.history.path, {
        symbol,
        interval: apiInterval,
        range: interval.toLowerCase(),
        region: "US",
      });

      const chartResult = response.data?.chart?.result?.[0];
      const timestamps: number[] = chartResult?.timestamp ?? [];
      const quotes = chartResult?.indicators?.quote?.[0] ?? {};
      const opens: number[] = quotes.open ?? [];
      const highs: number[] = quotes.high ?? [];
      const lows: number[] = quotes.low ?? [];
      const closes: number[] = quotes.close ?? [];
      const volumes: number[] = quotes.volume ?? [];

      const data: OHLCVPoint[] = [];
      for (let i = 0; i < timestamps.length; i++) {
        if (closes[i] == null) continue;
        data.push({
          time: timestamps[i] as UTCTimestamp,
          open: opens[i] ?? closes[i],
          high: highs[i] ?? closes[i],
          low: lows[i] ?? closes[i],
          close: closes[i],
          volume: volumes[i] ?? 0,
        });
      }

      return data.slice(-limit);
    } catch (error) {
      console.error("[QuoteChartLW] fetch error:", error);
      // Fall back to demo data
      return generateDemoOHLCV(symbol, interval);
    }
  }, [symbol, interval]);

  const { data: ohlcvData, isLoading, isError } = useQuery({
    queryKey: ["chartOHLCV", symbol, interval],
    queryFn: fetchOHLCV,
    staleTime: ENDPOINTS.history.cache.stale,
    gcTime: ENDPOINTS.history.cache.gc,
    refetchInterval: interval === "1D" ? getQuoteRefreshInterval() : false,
    refetchIntervalInBackground: false,
  });

  // ── Chart lifecycle ──

  // Determine color direction
  const direction = useMemo(() => {
    if (!ohlcvData || ohlcvData.length < 2) return "positive";
    if (interval === "1D" && prevClose > 0) {
      return ohlcvData[ohlcvData.length - 1].close >= prevClose
        ? "positive"
        : "negative";
    }
    return ohlcvData[ohlcvData.length - 1].close >= ohlcvData[0].close
      ? "positive"
      : "negative";
  }, [ohlcvData, interval, prevClose]);

  // Create & update chart
  useEffect(() => {
    if (!chartContainerRef.current || !ohlcvData || ohlcvData.length === 0) return;

    // Destroy previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      mainSeriesRef.current = null;
      volumeSeriesRef.current = null;
    }

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: showVolume ? 340 : 280,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: colors.text,
        fontFamily: "'Roboto', 'Google Sans', Arial, sans-serif",
        fontSize: 12,
      },
      grid: {
        vertLines: { color: colors.grid },
        horzLines: { color: colors.grid },
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: { color: colors.crosshair, width: 1, style: 3 },
        horzLine: { color: colors.crosshair, width: 1, style: 3 },
      },
      rightPriceScale: {
        borderColor: colors.grid,
        scaleMargins: showVolume
          ? { top: 0.05, bottom: 0.25 }
          : { top: 0.05, bottom: 0.05 },
      },
      timeScale: {
        borderColor: colors.grid,
        timeVisible: interval === "1D" || interval === "5D",
        secondsVisible: false,
      },
      handleScroll: { vertTouchDrag: false },
    });

    chartRef.current = chart;

    const lineColor = direction === "positive" ? colors.positive : colors.negative;
    const areaTop = direction === "positive" ? colors.positiveArea : colors.negativeArea;

    // ── Main series ──
    if (chartMode === "candle") {
      const series = chart.addCandlestickSeries({
        upColor: colors.positive,
        downColor: colors.negative,
        borderUpColor: colors.positive,
        borderDownColor: colors.negative,
        wickUpColor: colors.positive,
        wickDownColor: colors.negative,
      });
      series.setData(
        ohlcvData.map((p) => ({
          time: p.time,
          open: p.open,
          high: p.high,
          low: p.low,
          close: p.close,
        }))
      );
      mainSeriesRef.current = series as ISeriesApi<SeriesType>;
    } else {
      // Area mode
      const series = chart.addAreaSeries({
        lineColor,
        topColor: areaTop,
        bottomColor: "transparent",
        lineWidth: 2,
        crosshairMarkerRadius: 4,
        crosshairMarkerBorderColor: lineColor,
        crosshairMarkerBackgroundColor: lineColor,
      });
      series.setData(
        ohlcvData.map((p) => ({
          time: p.time,
          value: p.close,
        }))
      );
      mainSeriesRef.current = series as ISeriesApi<SeriesType>;

      // Previous close line for 1D
      if (interval === "1D" && prevClose > 0) {
        series.createPriceLine({
          price: prevClose,
          color: colors.crosshair,
          lineWidth: 1,
          lineStyle: 2, // dashed
          axisLabelVisible: true,
          title: "Prev close",
        });
      }
    }

    // ── Volume series ──
    if (showVolume) {
      const volSeries = chart.addHistogramSeries({
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
      });

      chart.priceScale("volume").applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });

      volSeries.setData(
        ohlcvData.map((p) => ({
          time: p.time,
          value: p.volume,
          color: p.close >= p.open ? colors.volumeUp : colors.volumeDown,
        }))
      );
      volumeSeriesRef.current = volSeries as ISeriesApi<SeriesType>;
    }

    chart.timeScale().fitContent();

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        chart.applyOptions({ width });
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      mainSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [ohlcvData, chartMode, showVolume, colors, direction, interval, prevClose]);

  // ── Render ──

  if (isLoading) {
    return (
      <div className="chart-quote chart-placeholder">
        <div className="chart-loading-shimmer" />
      </div>
    );
  }

  if (isError || !ohlcvData || ohlcvData.length === 0) {
    return (
      <div className="chart-quote chart-placeholder">
        <span>Unable to load chart data</span>
        <button
          onClick={() =>
            queryClient.invalidateQueries({
              queryKey: ["chartOHLCV", symbol, interval],
            })
          }
          style={{
            marginTop: 8,
            background: "var(--bg-hover)",
            border: "1px solid var(--border-strong)",
            color: "var(--text-secondary)",
            borderRadius: 6,
            padding: "4px 14px",
            fontSize: "0.8rem",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return <div ref={chartContainerRef} className="chart-quote chart-lw" />;
};

export default QuoteChartLW;
