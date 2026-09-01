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
import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import type { MeterReading, TimeScale } from '../api/types';
import type { Theme } from '../hooks/useTheme';
import { formatTimestamp } from '../utils/format';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface Props {
  history: MeterReading[];
  timeScale: TimeScale;
  theme: Theme;
}

export function TemperatureChart({ history, timeScale, theme }: Props) {
  const isDark = theme === 'dark';
  const tickColor = isDark ? '#94a3b8' : '#777777';
  const gridColor = isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(0, 0, 0, 0.05)';

  const data = useMemo(
    () => ({
      labels: history.map((reading) => formatTimestamp(reading.timestamp, timeScale)),
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
        legend: { display: false, labels: { color: tickColor } },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (context) => {
              const value = context.parsed.y;
              return value === null || value === undefined ? '' : `${value.toFixed(1)}\u00b0C`;
            },
          },
        },
      },
      scales: {
        x: {
          display: true,
          grid: { display: true, color: gridColor },
          ticks: { maxTicksLimit: 8, font: { size: 10 }, color: tickColor },
        },
        y: {
          display: true,
          grid: { display: true, color: gridColor },
          ticks: {
            font: { size: 10 },
            color: tickColor,
            callback: (value) => `${value}\u00b0`,
          },
        },
      },
    }),
    [gridColor, tickColor],
  );

  return (
    <div className="relative h-[200px]">
      <Line data={data} options={options} />
    </div>
  );
}
