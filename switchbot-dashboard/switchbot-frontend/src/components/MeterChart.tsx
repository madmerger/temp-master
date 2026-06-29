import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";
import type { MeterReading, TimeScale } from "../types";
import { formatTimestamp } from "../utils/formatTimestamp";
import { themes } from "../theme";
import type { ThemeMode } from "../types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

interface MeterChartProps {
  history: MeterReading[];
  timeScale: TimeScale;
  theme: ThemeMode;
}

export function MeterChart({ history, timeScale, theme }: MeterChartProps) {
  const tokens = themes[theme];

  const chartData = useMemo(() => {
    const labels = history.map((r) => formatTimestamp(r.timestamp, timeScale));
    const temperatures = history.map((r) => r.temperature);

    return {
      labels,
      datasets: [
        {
          label: "Temperature (C)",
          data: temperatures,
          borderColor: tokens.chartLine,
          backgroundColor: tokens.chartFill,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: tokens.chartLine,
          pointBorderColor: tokens.chartLine,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: tokens.chartHover,
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [history, timeScale, tokens]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: "index" as const,
          intersect: false,
          callbacks: {
            label: (ctx: { parsed: { y: number | null } }) => {
              const v = ctx.parsed.y;
              if (v === null || v === undefined) return "";
              return `${v.toFixed(1)}\u00b0C`;
            },
          },
        },
      },
      scales: {
        x: {
          display: true,
          grid: { display: true, color: tokens.chartGrid },
          ticks: {
            maxTicksLimit: 8,
            font: { size: 10 },
            color: tokens.chartTick,
          },
        },
        y: {
          display: true,
          grid: { display: true, color: tokens.chartGrid },
          ticks: {
            font: { size: 10 },
            color: tokens.chartTick,
            callback: (value: string | number) => `${value}\u00b0`,
          },
        },
      },
    }),
    [tokens],
  );

  return (
    <div className="meter-chart-wrap">
      <Line data={chartData} options={options} />
    </div>
  );
}
