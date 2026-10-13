import { useMemo } from 'react';
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { HistoryReading, TimeScale } from '../api/types';
import { formatTemperatureAxisTick, formatTimestamp } from '../lib/format';
import { useTheme } from '../theme/ThemeProvider';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
);

interface HistoryChartProps {
  history: HistoryReading[];
  timeScale: TimeScale;
}

export function HistoryChart({ history, timeScale }: HistoryChartProps) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === 'dark';
  const axisColor = dark ? '#9ca3af' : '#777';
  const gridColor = dark
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(0, 0, 0, 0.05)';

  const data = useMemo(
    () => ({
      labels: history.map((reading) =>
        formatTimestamp(reading.timestamp, timeScale),
      ),
      datasets: [
        {
          label: 'Temperature (C)',
          data: history.map((reading) => reading.temperature),
          borderColor: '#d9534f',
          backgroundColor: 'rgba(217, 83, 79, 0.15)',
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#d9534f',
          pointBorderColor: '#d9534f',
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#5bc0de',
          fill: true,
          tension: 0.4,
        },
      ],
    }),
    [history, timeScale],
  );

  const options = useMemo<ChartOptions<'line'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (context) => {
              const value = context.parsed.y;
              return value === null || value === undefined
                ? ''
                : `${value.toFixed(1)}°C`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: {
            maxTicksLimit: 8,
            color: axisColor,
            font: { size: 10 },
          },
        },
        y: {
          grid: { color: gridColor },
          ticks: {
            color: axisColor,
            font: { size: 10 },
            callback: (value) => formatTemperatureAxisTick(value),
          },
        },
      },
    }),
    [axisColor, gridColor],
  );

  return (
    <div className="relative h-[200px]">
      <Line
        key={`${timeScale}-${resolvedTheme}`}
        data={data}
        options={options}
      />
    </div>
  );
}
