import React from "react";
import { Chart } from "react-google-charts";
interface PortfolioChartProps {
  chartName: string;
  data: Array<{ date: string; value: string | number }>;
}

const PortfolioChart: React.FC<PortfolioChartProps> = ({ data }) => {
  // Filter out entries with invalid values before passing to Google Charts
  const validData = data.filter((entry) => {
    const val = Number(entry.value);
    return !isNaN(val) && isFinite(val);
  });

  // Don't render the chart if there's no valid data
  if (validData.length === 0) {
    return (
      <div className="portfolio-chart">
        <p style={{ color: "var(--text-secondary, #999)", fontSize: "0.9rem" }}>
          Portfolio value will appear here after the next trading day
        </p>
      </div>
    );
  }

  const chartData = [
    ["Date", "Value"],
    ...validData.map((entry) => [entry.date, Number(entry.value)]),
  ];
  const options = {
    title: ``,
    curveType: "function",
    legend: { position: "bottom", textStyle: { color: "white" } },
    backgroundColor: "transparent",
    vAxis: {
      textStyle: {
        color: "white",
        fontName: "Arial",
        fontSize: 12,
        bold: false,
        italic: false,
      },
    },
    hAxis: {
      textStyle: {
        color: "white",
        fontName: "Arial",
        fontSize: 12,
        bold: false,
        italic: false,
      },
    },
  };

  return (
    <div className="portfolio-chart">
      <Chart
        chartType="LineChart"
        width="75%"
        height="400px"
        data={chartData}
        options={options}
      />
    </div>
  );
};

export default PortfolioChart;
