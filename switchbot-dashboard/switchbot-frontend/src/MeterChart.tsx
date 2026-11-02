import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { fetchHistory } from './api';
import { useTheme } from './useTheme';
import type { HistoryPoint, TimeScale } from './types';
import { formatTimestamp } from './utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
);

function readChartColors() {
  const styles = getComputedStyle(document.documentElement);
  return {
    line: styles.getPropertyValue('--chart-line').trim(),
    fill: styles.getPropertyValue('--chart-fill').trim(),
    point: styles.getPropertyValue('--chart-point').trim(),
    hoverPoint: styles.getPropertyValue('--chart-hover-point').trim(),
    grid: styles.getPropertyValue('--chart-grid').trim(),
    tick: styles.getPropertyValue('--chart-tick').trim(),
  };
}

interface MeterChartProps {
  deviceId: string;
  timeScale: TimeScale;
  reloadToken: number;
}

export function MeterChart({ deviceId, timeScale, reloadToken }: MeterChartProps) {
  const { theme } = useTheme();
  const [history, setHistory] = useState<HistoryPoint[]>([]);

  useEffect(() => {
    let ignore = false;
    void fetchHistory(deviceId, timeScale)
      .then((response) => {
        if (!ignore) {
          setHistory(response.history ?? []);
        }
      })
      .catch(() => {
        // Keep the previous chart data when history is temporarily unavailable.
      });
    return () => {
      ignore = true;
    };
  }, [deviceId, timeScale, reloadToken]);

  // Chart colors come from CSS variables, so the theme is an implicit dependency.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const chartColors = useMemo(() => readChartColors(), [theme]);

  const data = useMemo(
    () => ({
      labels: history.map((point) => formatTimestamp(point.timestamp, timeScale)),
      datasets: [
        {
          label: 'Temperature (C)',
          data: history.map((point) => point.temperature),
          borderColor: chartColors.line,
          backgroundColor: chartColors.fill,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: chartColors.point,
          pointBorderColor: chartColors.point,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: chartColors.hoverPoint,
          fill: true,
          tension: 0.4,
        },
      ],
    }),
    [chartColors, history, timeScale],
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index' as const,
          intersect: false,
          callbacks: {
            label: (context: { parsed: { y: number | null } }) =>
              context.parsed.y === null ? '' : `${context.parsed.y.toFixed(1)}°C`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: true, color: chartColors.grid },
          ticks: {
            maxTicksLimit: 8,
            color: chartColors.tick,
            font: { size: 10 },
          },
        },
        y: {
          grid: { display: true, color: chartColors.grid },
          ticks: {
            color: chartColors.tick,
            font: { size: 10 },
            callback: (value: string | number) =>
              `${Number(Number(value).toFixed(1))}°`,
          },
        },
      },
    }),
    [chartColors],
  );

  return <Line key={theme} data={data} options={options} />;
}
