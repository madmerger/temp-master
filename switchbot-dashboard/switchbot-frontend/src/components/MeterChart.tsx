import { useQuery } from '@tanstack/react-query';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fetchHistory } from '../api/client';
import { REFRESH_INTERVAL } from '../config';
import { formatTimestamp } from '../lib/format';
import { chartColors, useTheme } from '../theme/ThemeContext';
import type { TimeScale } from '../types';

export const MeterChart = ({ deviceId, timeScale }: { deviceId: string; timeScale: TimeScale }) => {
  const { theme } = useTheme();
  const colors = chartColors[theme];
  const historyQuery = useQuery({
    queryKey: ['history', deviceId, timeScale],
    queryFn: () => fetchHistory(deviceId, timeScale),
    refetchInterval: REFRESH_INTERVAL,
  });
  const history = historyQuery.data?.history ?? [];

  return (
    <div className="meter-chart-wrap">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={history}>
          <CartesianGrid stroke={colors.grid} />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(timestamp: string) => formatTimestamp(timestamp, timeScale)}
            tick={{ fontSize: 10, fill: colors.tick }}
            minTickGap={40}
          />
          <YAxis
            tickFormatter={(value: number) => `${value}°`}
            tick={{ fontSize: 10, fill: colors.tick }}
            domain={['auto', 'auto']}
          />
          <Tooltip
            formatter={(value) => [`${Number(value).toFixed(1)}°C`, 'Temperature']}
            labelFormatter={(timestamp) => formatTimestamp(String(timestamp), timeScale)}
            contentStyle={{ backgroundColor: colors.tooltipBg, color: colors.tooltipText, borderColor: colors.grid }}
            itemStyle={{ color: colors.tooltipText }}
            labelStyle={{ color: colors.tooltipText }}
          />
          <Line
            type="monotone"
            dataKey="temperature"
            stroke={colors.line}
            strokeWidth={2}
            dot={{ r: 3, fill: colors.line, stroke: colors.line }}
            activeDot={{ r: 5, fill: colors.activeDot }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
