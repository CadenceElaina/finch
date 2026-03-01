import React from "react";
import {
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceDot,
  ReferenceLine,
  Area,
  ComposedChart,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { ENDPOINTS, yhFetch, getQuoteRefreshInterval } from "../../config/api";
import { formatTime, formatXAxis } from "./QuoteChartUtils";
import { queryClient } from "./quoteQueryClient";
import { isDemoActive } from "../../data/demo/demoState";
import { getDemoChartData } from "../../data/demo/charts";
import "./QuoteChart.css";

type ChartData = {
  time: string;
  close: number;
  formattedXAxis: string;
};


/** Map UI period strings to API interval + limit params */
function periodToParams(period: string): { interval: string; limit: number } {
  switch (period) {
    case "1D":
      return { interval: "5m", limit: 640 };
    case "5D":
      return { interval: "15m", limit: 640 };
    case "1M":
      return { interval: "1d", limit: 30 };
    case "6M":
      return { interval: "1d", limit: 180 };
    case "YTD":
      return { interval: "1d", limit: 365 };
    case "1Y":
      return { interval: "1d", limit: 365 };
    case "5Y":
      return { interval: "1wk", limit: 260 };
    case "MAX":
      return { interval: "1mo", limit: 600 };
    default:
      return { interval: "1d", limit: 30 };
  }
}

const QuoteChart: React.FC<{
  interval: string;
  symbol: string;
  previousClosePrice: string;
}> = ({ interval, symbol, previousClosePrice }) => {
  queryClient.setQueryDefaults(["chartData"], { gcTime: 1000 * 60 * 30 });
  const period = interval;

  let previousCloseWithoutSymbol = "";
  if (previousClosePrice !== undefined && previousClosePrice) {
    previousCloseWithoutSymbol = previousClosePrice.replace("$", "");
  }
  // Convert the string to a floating-point number using parseFloat()
  const previousCloseNumber = parseFloat(previousCloseWithoutSymbol);

  const fetchChartData = async (symbol: string, period: string) => {
    const chartQueryKey = ["chartData", symbol, period];

    // Check the cache first
    const cachedChartData = queryClient.getQueryData(chartQueryKey);
    if (cachedChartData) {
      return { chartData: cachedChartData };
    }

    // Return demo data when API is unavailable
    if (isDemoActive()) {
      const demoData = getDemoChartData(symbol.replace("^", ""), period);
      queryClient.setQueryData(chartQueryKey, demoData);
      return { chartData: demoData };
    }

    const { interval: apiInterval, limit } = periodToParams(period);

    try {
      const response = await yhFetch(ENDPOINTS.history.path, {
        symbol: symbol,
        interval: apiInterval,
        range: period.toLowerCase(),
        region: "US",
      });

      // YH Finance chart response: chart.result[0].indicators.quote[0]
      const chartResult = response.data?.chart?.result?.[0];
      const timestamps = chartResult?.timestamp ?? [];
      const quotes = chartResult?.indicators?.quote?.[0] ?? {};
      const closes: number[] = quotes.close ?? [];

      const chartData = timestamps
        .map((ts: number, i: number) => {
          if (closes[i] == null) return null;
          const time = new Date(ts * 1000);
          return {
            time: formatTime(time, interval),
            close: closes[i],
            formattedXAxis: formatXAxis(time, interval),
          };
        })
        .filter(Boolean)
        .slice(-limit);

      // Cache the chart data
      queryClient.setQueryData(chartQueryKey, chartData);

      return { chartData };
    } catch (error) {
      console.error(error);
      throw new Error("Error fetching data");
    }
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["chartData", symbol, period],
    queryFn: () => fetchChartData(symbol, period),
    staleTime: ENDPOINTS.history.cache.stale,
    gcTime: ENDPOINTS.history.cache.gc,
    // Only poll intraday charts when market is open
    refetchInterval: period === "1D" ? getQuoteRefreshInterval() : false,
    refetchIntervalInBackground: false,
  });

  if (isLoading)
    return (
      <div className="chart-quote chart-placeholder">
        <div className="chart-loading-shimmer" />
      </div>
    );
  if (isError)
    return (
      <div className="chart-quote chart-placeholder">
        <span>Unable to load chart data</span>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ["chartData", symbol, period] })}
          style={{
            marginTop: 8,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "rgba(255,255,255,0.7)",
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
  if (!data?.chartData)
    return (
      <div className="chart-quote chart-placeholder">
        <span>No chart data available</span>
      </div>
    );

  const uniqueDaysSet = new Set();
  const uniqueYearsSet = new Set();

  const chartData = (data.chartData as ChartData[]).map((entry) => {
    if (interval === "5Y" || interval === "MAX") {
      const year = entry.formattedXAxis;
      uniqueYearsSet.add(year);
      return {
        time: entry.time,
        close: entry.close,
        formattedXAxis: entry.formattedXAxis,
      };
    }
    if (
      interval === "1D" ||
      interval === "5D" ||
      interval === "1M" ||
      interval === "6M" ||
      interval === "YTD" ||
      interval === "1Y"
    ) {
      const day = entry.formattedXAxis;

      // Include the day in the set if it doesn't exist
      uniqueDaysSet.add(day);
      return {
        time: entry.time,
        close: entry.close,
        formattedXAxis: entry.formattedXAxis,
      };
    }
  });

  const uniqueDaysArray = Array.from(uniqueDaysSet);

  let lineStrokeColor = "#8884d8"; // Default color

  if (chartData.length > 0) {
    if (interval === "1D" && previousCloseNumber !== undefined) {
      const finalClose = chartData[chartData.length - 1]?.close;
      // Compare final close with previous close and set line color accordingly
      if (finalClose !== undefined) {
        lineStrokeColor = finalClose > previousCloseNumber ? "green" : "red";
      }
    } else if (interval !== "1D") {
      const initialPrice = chartData[0]?.close;
      const finalClose = chartData[chartData.length - 1]?.close;
      if (initialPrice !== undefined && finalClose !== undefined) {
        lineStrokeColor = finalClose > initialPrice ? "green" : "red";
      }
    }
  }
  const areaFill =
    lineStrokeColor === "red" ? "rgba(255, 0, 0, 0.2)" : "rgba(0, 255, 0, 0.2)";
  return (
    <div className="chart-quote">
      <ResponsiveContainer width="100%" height={528}>
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="formattedXAxis"
            tick={{ fontSize: 12 }}
            ticks={uniqueDaysArray as (string | number)[]}
          />
          <YAxis
            scale="linear"
            domain={
              interval === "1D" && previousCloseNumber !== 0
                ? [previousCloseNumber, "auto"]
                : ["auto", "auto"]
            }
          />
          <Tooltip
            content={({ payload }) => {
              if (!payload || payload.length === 0 || !payload[0].payload) {
                return null;
              }
              if (payload && payload.length > 0) {
                const { time, close } = payload[0].payload;
                return (
                  <div className="custom-tooltip">
                    <p>{`Time: ${time}`}</p>
                    <p>{`Price: ${close}`}</p>
                  </div>
                );
              }
              return null;
            }}
          />

          <Area
            type="monotone"
            dataKey="close"
            fill={areaFill}
            stroke={lineStrokeColor}
          />
          <Line
            type="monotone"
            dataKey="close"
            stroke={lineStrokeColor}
            dot={false}
          />
          {interval === "1D" &&
            previousCloseNumber !== undefined &&
            previousCloseNumber !== 0 &&
            chartData.length > 0 && (
              <>
                {/* Horizontal Dotted Line */}
                <ReferenceLine
                  y={previousCloseNumber}
                  stroke="black"
                  strokeDasharray="3 3"
                  label={`Prev close ${previousCloseNumber}`}
                />

                {/* Reference Dot with Label */}
                <ReferenceDot
                  x={chartData[chartData.length - 1]?.formattedXAxis} // X-coordinate of the dot (last data point)
                  y={previousCloseNumber} // Y-coordinate of the dot (previous close price)
                  r={0} // Radius of the dot
                  fill="white" // Dot color
                  stroke="none"
                >
                  {/* Label for the dot */}
                  <text x={10} y={-10} dy={-4} fontSize={12} fill="white">
                    Prev close
                  </text>
                  <text x={10} y={-10} dy={12} fontSize={12} fill="black">
                    ${previousCloseNumber}
                  </text>
                </ReferenceDot>
              </>
            )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default QuoteChart;
