import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ReactNode } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { formatTimestamp } from '../lib/constants';
import type { HistoryReading, TimeScale } from '../types';

const MAX_POINTS_WITH_DOTS = 500;

interface TemperatureChartProps {
  history: HistoryReading[];
  timeScale: TimeScale;
}

export function TemperatureChart({ history, timeScale }: TemperatureChartProps) {
  const { theme } = useTheme();
  const colors = theme === 'dark'
    ? { grid: '#475569', axis: '#cbd5e1', tooltipBackground: '#1e293b', tooltipBorder: '#64748b', tooltipText: '#f8fafc', line: '#f87171', fill: '#f87171' }
    : { grid: '#e2e8f0', axis: '#64748b', tooltipBackground: '#ffffff', tooltipBorder: '#cbd5e1', tooltipText: '#0f172a', line: '#d9534f', fill: '#d9534f' };
  const data = history.map((reading) => ({ ...reading, temperatureValue: reading.temperature }));
  const showDots = data.length <= MAX_POINTS_WITH_DOTS;

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(value: string) => formatTimestamp(value, timeScale)}
            tick={{ fill: colors.axis, fontSize: 10 }}
            tickLine={{ stroke: colors.axis }}
            axisLine={{ stroke: colors.axis }}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(value: number) => `${value}°`}
            tick={{ fill: colors.axis, fontSize: 10 }}
            tickLine={{ stroke: colors.axis }}
            axisLine={{ stroke: colors.axis }}
          />
          <Tooltip
            labelFormatter={(label: ReactNode) => formatTimestamp(String(label), timeScale)}
            formatter={(value: unknown) => [value == null ? '' : `${Number(value).toFixed(1)}°C`, 'Temperature']}
            contentStyle={{ backgroundColor: colors.tooltipBackground, border: `1px solid ${colors.tooltipBorder}`, color: colors.tooltipText }}
            labelStyle={{ color: colors.tooltipText }}
            itemStyle={{ color: colors.tooltipText }}
            cursor={{ stroke: colors.grid }}
          />
          <Line type="monotone" dataKey="temperatureValue" stroke={colors.line} fill={colors.fill} strokeWidth={2} dot={showDots ? { r: 3, fill: colors.line, stroke: colors.line } : false} activeDot={{ r: 5, fill: theme === 'dark' ? '#38bdf8' : '#5bc0de' }} isAnimationActive={false} name="Temperature" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
