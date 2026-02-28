import React from "react";
import { Chart } from "react-google-charts";
interface PortfolioChartProps {
  chartName: string;
  data: Array<{ date: string; value: string | number }>;
}

const PortfolioChart: React.FC<PortfolioChartProps> = ({ data }) => {
  const chartData = [
    ["Date", "Value"],
    ...data.map((entry) => [entry.date, entry.value]),
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
