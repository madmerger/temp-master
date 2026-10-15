import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Ticks,
  Tooltip,
  type ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useHistoryQuery } from '../hooks/useDashboardQueries';
import { getChartColors } from '../lib/chartTheme';
import { formatTimestamp } from '../lib/time';
import type { TimeScale } from '../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface MeterChartProps {
  deviceId: string;
  timeScale: TimeScale;
  isDark: boolean;
}

export function MeterChart({ deviceId, timeScale, isDark }: MeterChartProps) {
  const historyQuery = useHistoryQuery(deviceId, timeScale);
  const history = historyQuery.data?.history ?? [];
  const colors = getChartColors(isDark);

  const data = {
    labels: history.map((point) => formatTimestamp(point.timestamp, timeScale)),
    datasets: [
      {
        label: 'Temperature (C)',
        data: history.map((point) => point.temperature),
        borderColor: colors.line,
        backgroundColor: colors.fill,
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: colors.line,
        pointBorderColor: colors.line,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: colors.pointHoverBackground,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: colors.tooltip.background,
        titleColor: colors.tooltip.title,
        bodyColor: colors.tooltip.body,
        borderColor: colors.tooltip.border,
        borderWidth: 1,
        callbacks: {
          label: (item) => (typeof item.parsed.y === 'number' ? `${item.parsed.y.toFixed(1)}°C` : ''),
        },
      },
    },
    scales: {
      x: {
        grid: { color: colors.grid },
        ticks: {
          maxTicksLimit: 8,
          font: { size: 10 },
          color: colors.tick,
        },
      },
      y: {
        grid: { color: colors.grid },
        ticks: {
          font: { size: 10 },
          color: colors.tick,
          callback(value, index, ticks) {
            return `${Ticks.formatters.numeric.call(this, Number(value), index, ticks)}°`;
          },
        },
      },
    },
  };

  return <Line data={data} options={options} aria-label="Temperature history chart" role="img" />;
}
