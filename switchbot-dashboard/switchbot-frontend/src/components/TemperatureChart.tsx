import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useHistory } from '../hooks/useHistory';
import { useTheme } from '../hooks/useTheme';
import type { TimeScale } from '../types';
import { formatTimestamp } from '../utils/format';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
);

interface Props {
  deviceId: string;
  timeScale: TimeScale;
  refreshKey: number;
}

export default function TemperatureChart({ deviceId, timeScale, refreshKey }: Props) {
  const { history, loading } = useHistory(deviceId, timeScale, refreshKey);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const gridColor = isDark ? 'rgba(148, 163, 184, 0.18)' : 'rgba(0, 0, 0, 0.06)';
  const tickColor = isDark ? '#94a3b8' : '#6b7280';
  const lineColor = isDark ? '#f87171' : '#dc2626';
  const fillColor = isDark ? 'rgba(248, 113, 113, 0.15)' : 'rgba(220, 38, 38, 0.12)';

  const labels = history.map((h) => formatTimestamp(h.timestamp, timeScale));
  const temperatures = history.map((h) => h.temperature);

  const data: ChartData<'line'> = {
    labels,
    datasets: [
      {
        label: 'Temperature (C)',
        data: temperatures as number[],
        borderColor: lineColor,
        backgroundColor: fillColor,
        borderWidth: 2,
        pointRadius: 2,
        pointBackgroundColor: lineColor,
        pointBorderColor: lineColor,
        pointHoverRadius: 5,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (item) => {
            const v = item.parsed.y;
            return v === null || v === undefined ? '' : `${v.toFixed(1)}\u00b0C`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { maxTicksLimit: 8, font: { size: 10 }, color: tickColor },
      },
      y: {
        grid: { color: gridColor },
        ticks: {
          font: { size: 10 },
          color: tickColor,
          callback: (value) => `${value}\u00b0`,
        },
      },
    },
  };

  return (
    <div className="relative h-[200px]">
      {loading && history.length === 0 ? (
        <div className="flex h-full items-center justify-center text-xs text-gray-400 dark:text-gray-500">
          読み込み中...
        </div>
      ) : (
        <Line data={data} options={options} />
      )}
    </div>
  );
}
