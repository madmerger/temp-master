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
  type ChartData,
  type ChartOptions,
} from "chart.js";
import type { MeterReading, TimeScale } from "../api/meters";
import { useTheme } from "../theme/ThemeContext";
import { formatTimestamp } from "../utils/formatTimestamp";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
);

interface MeterChartProps {
  history: MeterReading[];
  timeScale: TimeScale;
}

export function MeterChart({ history, timeScale }: MeterChartProps) {
  const { theme } = useTheme();

  const data = useMemo<ChartData<"line">>(
    () => ({
      labels: history.map((r) => formatTimestamp(r.timestamp, timeScale)),
      datasets: [
        {
          label: "Temperature (\u00b0C)",
          data: history.map((r) => r.temperature),
          borderColor: theme.chartLine,
          backgroundColor: theme.chartFill,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: theme.chartPoint,
          pointBorderColor: theme.chartPoint,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: theme.chartHover,
          fill: true,
          tension: 0.4,
        },
      ],
    }),
    [history, timeScale, theme],
  );

  const options = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: "index" as const,
          intersect: false,
          callbacks: {
            label(ctx) {
              const v = ctx.parsed.y;
              return v == null ? "" : `${v.toFixed(1)}\u00b0C`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: true, color: theme.chartGrid },
          ticks: {
            maxTicksLimit: 8,
            font: { size: 10 },
            color: theme.chartText,
          },
        },
        y: {
          grid: { display: true, color: theme.chartGrid },
          ticks: {
            font: { size: 10 },
            color: theme.chartText,
            callback(value) {
              return `${value}\u00b0`;
            },
          },
        },
      },
    }),
    [theme],
  );

  return (
    <div className="meter-chart-wrap">
      <Line data={data} options={options} />
    </div>
  );
}
