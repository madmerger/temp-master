import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useHistory } from '../hooks/useHistory';
import { useTheme } from '../hooks/useTheme';
import type { TimeScale } from '../types';
import { formatTimestamp } from '../utils/format';

interface Props {
  deviceId: string;
  timeScale: TimeScale;
  refreshKey: number;
}

export default function TemperatureChart({ deviceId, timeScale, refreshKey }: Props) {
  const { history, loading } = useHistory(deviceId, timeScale, refreshKey);
  const { theme } = useTheme();
  const styles = getComputedStyle(document.documentElement);
  const gridColor =
    styles.getPropertyValue('--chart-grid').trim() ||
    (theme === 'dark' ? 'rgba(148, 163, 184, 0.2)' : 'rgba(17, 24, 39, 0.1)');
  const tickColor =
    styles.getPropertyValue('--chart-axis').trim() ||
    (theme === 'dark' ? '#cbd5e1' : '#6b7280');
  const lineColor =
    styles.getPropertyValue('--chart-line').trim() ||
    (theme === 'dark' ? '#fb7185' : '#dc2626');
  const chartData = history
    .filter((point) => point.temperature !== null)
    .map((point) => ({
      label: formatTimestamp(point.timestamp, timeScale),
      temperature: point.temperature as number,
    }));

  return (
    <div className="relative h-[200px]">
      {loading && history.length === 0 ? (
        <div className="flex h-full items-center justify-center text-xs text-gray-400 dark:text-gray-500">
          読み込み中...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tick={{ fill: tickColor, fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: gridColor }}
              minTickGap={20}
            />
            <YAxis
              tick={{ fill: tickColor, fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => `${value}°`}
              width={42}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: styles.getPropertyValue('--chart-tooltip-bg').trim(),
                borderColor: styles.getPropertyValue('--border').trim(),
                color: styles.getPropertyValue('--text').trim(),
              }}
              formatter={(value) => [`${Number(value).toFixed(1)}°C`, 'Temperature']}
            />
            <Line
              type="monotone"
              dataKey="temperature"
              stroke={lineColor}
              strokeWidth={2}
              dot={{ r: 2, fill: lineColor }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
