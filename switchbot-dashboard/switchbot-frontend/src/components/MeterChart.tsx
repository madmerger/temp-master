import { useEffect, useMemo, useState } from 'react';
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
import { fetchHistory } from '../api/meters';
import { formatTimestamp } from '../utils/formatTimestamp';
import { getThemeById } from '../themes/themes';
import type { MeterReading, ThemeId, TimeScale } from '../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

interface MeterChartProps {
  deviceId: string;
  timeScale: TimeScale;
  refreshKey: number;
  themeId: ThemeId;
}

export function MeterChart({ deviceId, timeScale, refreshKey, themeId }: MeterChartProps) {
  const [history, setHistory] = useState<MeterReading[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchHistory(deviceId, timeScale)
      .then((res) => {
        if (!cancelled) setHistory(res.history);
      })
      .catch(() => {
        if (!cancelled) setHistory([]);
      });
    return () => { cancelled = true; };
  }, [deviceId, timeScale, refreshKey]);

  const colors = useMemo(() => {
    const vars = getThemeById(themeId).vars;
    return {
      line: vars['--chart-line'] || '#d32f2f',
      fill: vars['--chart-fill'] || 'rgba(211,47,47,0.12)',
      grid: vars['--chart-grid'] || 'rgba(0,0,0,0.06)',
      tick: vars['--chart-tick'] || '#757575',
    };
  }, [themeId]);

  const data = {
    labels: history.map((r) => formatTimestamp(r.timestamp, timeScale)),
    datasets: [
      {
        label: 'Temperature (\u00b0C)',
        data: history.map((r) => r.temperature),
        borderColor: colors.line,
        backgroundColor: colors.fill,
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: colors.line,
        pointBorderColor: colors.line,
        pointHoverRadius: 5,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: (ctx: { parsed: { y: number | null } }) => {
            const v = ctx.parsed.y;
            return v != null ? `${v.toFixed(1)}\u00b0C` : '';
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: { color: colors.grid },
        ticks: { maxTicksLimit: 8, font: { size: 10 }, color: colors.tick },
      },
      y: {
        display: true,
        grid: { color: colors.grid },
        ticks: {
          font: { size: 10 },
          color: colors.tick,
          callback: (value: string | number) => `${value}\u00b0`,
        },
      },
    },
  };

  return (
    <div className="chart-wrap">
      <Line data={data} options={options} />
    </div>
  );
}
