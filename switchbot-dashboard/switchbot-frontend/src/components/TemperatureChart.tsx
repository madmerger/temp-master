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
import type { Theme } from '../hooks/useTheme';
import type { TimeScale } from '../types';
import { formatTimestamp } from '../utils/format';

const CHART_PALETTE: Record<
  Theme,
  {
    grid: string;
    axis: string;
    line: string;
    tooltipBg: string;
    tooltipBorder: string;
    tooltipText: string;
  }
> = {
  light: {
    grid: 'rgba(17, 24, 39, 0.1)',
    axis: '#6b7280',
    line: '#dc2626',
    tooltipBg: '#ffffff',
    tooltipBorder: '#e5e7eb',
    tooltipText: '#111827',
  },
  dark: {
    grid: 'rgba(148, 163, 184, 0.2)',
    axis: '#cbd5e1',
    line: '#fb7185',
    tooltipBg: '#111827',
    tooltipBorder: '#374151',
    tooltipText: '#f3f4f6',
  },
};

interface Props {
  deviceId: string;
  timeScale: TimeScale;
  refreshKey: number;
}

export default function TemperatureChart({ deviceId, timeScale, refreshKey }: Props) {
  const { history, loading } = useHistory(deviceId, timeScale, refreshKey);
  const { theme } = useTheme();
  const colors = CHART_PALETTE[theme];
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
            <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tick={{ fill: colors.axis, fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: colors.grid }}
              minTickGap={20}
            />
            <YAxis
              tick={{ fill: colors.axis, fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => `${value}°`}
              width={42}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: colors.tooltipBg,
                borderColor: colors.tooltipBorder,
                color: colors.tooltipText,
              }}
              formatter={(value) => [`${Number(value).toFixed(1)}°C`, 'Temperature']}
            />
            <Line
              type="monotone"
              dataKey="temperature"
              stroke={colors.line}
              strokeWidth={2}
              dot={{ r: 2, fill: colors.line }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
