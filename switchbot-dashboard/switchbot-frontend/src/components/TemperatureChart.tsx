import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import { fetchHistory } from '../api/client';
import { formatTimestamp } from '../lib/format';
import type { HistoryReading, TimeScale } from '../types';
import styles from './TemperatureChart.module.css';

const LINE_COLOR = '#d9534f';
const HOVER_COLOR = '#5bc0de';
const GRID_COLOR = 'rgba(0, 0, 0, 0.05)';
const TICK_STYLE = { fontSize: 10, fill: '#777' };
// 旧実装（Chart.js の maxTicksLimit: 8）に合わせた X 軸ラベルの最大表示数
const MAX_X_TICKS = 8;

interface ChartPoint {
  index: number;
  label: string;
  temperature: number | null;
}

interface TemperatureChartProps {
  deviceId: string;
  timeScale: TimeScale;
  // 値が変わるたびに履歴を再取得する（自動リフレッシュ・手動リフレッシュ用）
  reloadKey: number;
}

function formatTemperature(value: unknown): string {
  return typeof value === 'number' ? `${value.toFixed(1)}\u00b0C` : '';
}

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipTitle}>{label}</div>
      <div className={styles.tooltipBody}>
        <span className={styles.tooltipSwatch} />
        {formatTemperature(payload[0].value)}
      </div>
    </div>
  );
}

// 1台分の温度履歴を取得し、Recharts の LineChart で描画する
export default function TemperatureChart({
  deviceId,
  timeScale,
  reloadKey,
}: TemperatureChartProps) {
  const [history, setHistory] = useState<{
    timeScale: TimeScale;
    readings: HistoryReading[];
  } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchHistory(deviceId, timeScale, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setHistory({ timeScale, readings: data?.history ?? [] });
        }
      })
      .catch(() => {
        // 旧実装と同様、履歴取得に失敗した場合はチャートを空にする
        if (!controller.signal.aborted) {
          setHistory(null);
        }
      });
    return () => controller.abort();
  }, [deviceId, timeScale, reloadKey]);

  // タイムスケール切替直後は、旧スケールのデータを描画しない
  const readings = history && history.timeScale === timeScale ? history.readings : null;

  const points = useMemo<ChartPoint[]>(
    () =>
      (readings ?? []).map((reading, index) => ({
        index,
        label: formatTimestamp(reading.timestamp, timeScale),
        temperature: reading.temperature ?? null,
      })),
    [readings, timeScale],
  );

  const xInterval = Math.max(0, Math.ceil(points.length / MAX_X_TICKS) - 1);

  return (
    <div
      className={styles.wrap}
      data-testid={`chart-${deviceId}`}
      data-points={readings ? points.length : undefined}
    >
      {readings && (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid stroke={GRID_COLOR} />
            <XAxis
              dataKey="label"
              interval={xInterval}
              tick={TICK_STYLE}
              tickLine={false}
              stroke={GRID_COLOR}
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={TICK_STYLE}
              tickLine={false}
              stroke={GRID_COLOR}
              tickFormatter={(value: number) => `${value}\u00b0`}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: GRID_COLOR }} />
            <Line
              type="monotone"
              dataKey="temperature"
              name="Temperature (C)"
              stroke={LINE_COLOR}
              strokeWidth={2}
              dot={{ r: 3, fill: LINE_COLOR, stroke: LINE_COLOR }}
              activeDot={{ r: 5, fill: HOVER_COLOR, stroke: LINE_COLOR }}
              isAnimationActive={false}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
