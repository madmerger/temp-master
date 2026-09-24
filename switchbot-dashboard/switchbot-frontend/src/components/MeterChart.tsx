import { useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js';
import { fetchHistory } from '../api';
import { useTheme } from '../theme/ThemeContext';
import { formatTimestamp } from '../utils';
import type { HistoryPoint, TimeScale } from '../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

interface MeterChartProps {
  deviceId: string;
  timeScale: TimeScale;
  refreshKey: number;
}

export function MeterChart({ deviceId, timeScale, refreshKey }: MeterChartProps) {
  const { theme } = useTheme();
  const [history, setHistory] = useState<HistoryPoint[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchHistory(deviceId, timeScale)
      .then((data) => {
        if (!cancelled) setHistory(data.history ?? []);
      })
      .catch(() => {
        /* keep previous data on error */
      });
    return () => {
      cancelled = true;
    };
  }, [deviceId, timeScale, refreshKey]);

  const dark = theme === 'dark';
  const gridColor = dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  const tickColor = dark ? '#aaa' : '#777';

  const data: ChartData<'line', (number | null)[]> = useMemo(
    () => ({
      labels: history.map((p) => formatTimestamp(p.timestamp, timeScale)),
      datasets: [
        {
          label: 'Temperature (C)',
          data: history.map((p) => p.temperature),
          borderColor: '#d9534f',
          backgroundColor: 'rgba(217, 83, 79, 0.15)',
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#d9534f',
          pointBorderColor: '#d9534f',
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#5bc0de',
          tension: 0.4,
          fill: true,
        },
      ],
    }),
    [history, timeScale]
  );

  const options: ChartOptions<'line'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: dark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(0, 0, 0, 0.8)',
          titleColor: dark ? '#e5e7eb' : '#fff',
          bodyColor: dark ? '#e5e7eb' : '#fff',
          callbacks: {
            label: (item) => {
              const v = item.parsed.y;
              if (v === null || v === undefined) return '';
              return `${v.toFixed(1)}°C`;
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
            callback: (value) => `${value}°`,
          },
        },
      },
    }),
    [dark, gridColor, tickColor]
  );

  return (
    <div className="relative h-[200px]">
      <Line data={data} options={options} />
    </div>
  );
}
