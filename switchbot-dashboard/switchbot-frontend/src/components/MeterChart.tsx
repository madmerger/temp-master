import { useEffect, useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fetchHistory } from '../api';
import { formatTimestamp } from '../meters';
import type { HistoryPoint, TimeScale } from '../types';

interface MeterChartProps {
  deviceId: string;
  timeScale: TimeScale;
  refreshKey: number;
  isDark: boolean;
}

interface LoadedHistory {
  timeScale: TimeScale;
  points: HistoryPoint[];
}

const MAX_X_TICKS = 8;
const LINE_COLOR = '#ef4444';
const LINE_HOVER_COLOR = '#38bdf8';

export default function MeterChart({ deviceId, timeScale, refreshKey, isDark }: MeterChartProps) {
  const [history, setHistory] = useState<LoadedHistory | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchHistory(deviceId, timeScale, controller.signal)
      .then((data) => setHistory({ timeScale, points: data.history ?? [] }))
      .catch(() => {
        // Keep the previously rendered history on transient failures.
      });
    return () => controller.abort();
  }, [deviceId, timeScale, refreshKey]);

  const data = useMemo(() => {
    if (!history || history.timeScale !== timeScale) return [];
    return history.points.map((p) => ({
      label: formatTimestamp(p.timestamp, timeScale),
      temperature: p.temperature,
    }));
  }, [history, timeScale]);

  const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)';
  const tickColor = isDark ? '#9ca3af' : '#6b7280';
  const xInterval = Math.max(0, Math.ceil(data.length / MAX_X_TICKS) - 1);

  return (
    <div className="h-[200px]" data-testid={`chart-${deviceId}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: -15 }}>
          <CartesianGrid stroke={gridColor} />
          <XAxis
            dataKey="label"
            interval={xInterval}
            tick={{ fontSize: 10, fill: tickColor }}
            stroke={gridColor}
          />
          <YAxis
            domain={['auto', 'auto']}
            tickFormatter={(v: number) => `${v}°`}
            tick={{ fontSize: 10, fill: tickColor }}
            stroke={gridColor}
          />
          <Tooltip
            formatter={(value) => [typeof value === 'number' ? `${value.toFixed(1)}°C` : '', 'Temperature']}
            contentStyle={{
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              borderColor: isDark ? '#374151' : '#e5e7eb',
              color: isDark ? '#f3f4f6' : '#111827',
              fontSize: 12,
            }}
            labelStyle={{ color: isDark ? '#d1d5db' : '#374151' }}
            cursor={{ stroke: tickColor, strokeDasharray: '3 3' }}
          />
          <Line
            type="monotone"
            dataKey="temperature"
            stroke={LINE_COLOR}
            strokeWidth={2}
            dot={{ r: 3, fill: LINE_COLOR, stroke: LINE_COLOR }}
            activeDot={{ r: 5, fill: LINE_HOVER_COLOR, stroke: LINE_HOVER_COLOR }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
