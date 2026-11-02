import { useMemo } from 'react';
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { HistoryPoint, TimeScale } from '../types';
import { formatTimestamp } from '../utils/format';
import { chartColors } from '../theme/chartColors';
import { useTheme } from '../theme/useTheme';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

interface TemperatureChartProps {
  history: HistoryPoint[];
  timeScale: TimeScale;
}

export default function TemperatureChart({ history, timeScale }: TemperatureChartProps) {
  const { theme } = useTheme();
  const colors = chartColors[theme];
  const data = useMemo(
    () => ({
      labels: history.map((point) => formatTimestamp(point.timestamp, timeScale)),
      datasets: [
        {
          label: 'Temperature (C)',
          data: history.map((point) => point.temperature),
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
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: colors.tooltipBackground,
          titleColor: colors.tooltipText,
          bodyColor: colors.tooltipText,
          callbacks: {
            label: (context) =>
              context.parsed.y === null ? '' : `${context.parsed.y.toFixed(1)}°C`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: true, color: colors.grid },
          ticks: { maxTicksLimit: 8, font: { size: 10 }, color: colors.ticks },
        },
        y: {
          grid: { display: true, color: colors.grid },
          ticks: {
            font: { size: 10 },
            color: colors.ticks,
            callback: (value) => `${value}°`,
          },
        },
      },
    }),
    [colors],
  );

  return <Line data={data} options={options} />;
}
