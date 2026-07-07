import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js';
import type { ChartOptions } from 'chart.js';
import { fetchHistory } from '../api';
import { formatTimestamp } from '../utils';
import type { TimeScale } from '../constants';
import type { MeterReading } from '../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

interface MeterChartProps {
  deviceId: string;
  timeScale: TimeScale;
}

const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    tooltip: {
      mode: 'index',
      intersect: false,
      callbacks: {
        label(ctx) {
          const v = ctx.parsed.y;
          return v == null ? '' : `${v.toFixed(1)}\u00b0C`;
        },
      },
    },
  },
  scales: {
    x: {
      display: true,
      grid: { color: 'rgba(0, 0, 0, 0.05)' },
      ticks: { maxTicksLimit: 8, font: { size: 10 }, color: '#777' },
    },
    y: {
      display: true,
      grid: { color: 'rgba(0, 0, 0, 0.05)' },
      ticks: {
        font: { size: 10 },
        color: '#777',
        callback(value) {
          return `${value}\u00b0`;
        },
      },
    },
  },
};

export function MeterChart({ deviceId, timeScale }: MeterChartProps) {
  const [history, setHistory] = useState<MeterReading[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchHistory(deviceId, timeScale)
      .then((data) => {
        if (!cancelled) setHistory(data.history);
      })
      .catch(() => {
        // Non-critical
      });
    return () => {
      cancelled = true;
    };
  }, [deviceId, timeScale]);

  const labels = history.map((r) => formatTimestamp(r.timestamp, timeScale));
  const temperatures = history.map((r) => r.temperature);

  const data = {
    labels,
    datasets: [
      {
        label: 'Temperature (C)',
        data: temperatures,
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
  };

  return (
    <div style={{ position: 'relative', height: 200 }}>
      <Line data={data} options={chartOptions} />
    </div>
  );
}
