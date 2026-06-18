import { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Brush,
} from 'recharts';
import { useTheme } from '@mui/material';
import type { MeterReading, TimeScale } from '../../types';
import { formatTimestamp } from '../../utils/format';

interface TemperatureChartProps {
  history: MeterReading[];
  timeScale: TimeScale;
}

export default function TemperatureChart({ history, timeScale }: TemperatureChartProps) {
  const theme = useTheme();

  const data = useMemo(
    () =>
      history.map((r) => ({
        time: formatTimestamp(r.timestamp, timeScale),
        temp: r.temperature,
        humidity: r.humidity,
        raw: r.timestamp,
      })),
    [history, timeScale],
  );

  if (data.length === 0) {
    return null;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id={`tempGrad-${theme.chart.temperature}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.chart.temperature} stopOpacity={0.3} />
            <stop offset="100%" stopColor={theme.chart.temperature} stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id={`humGrad-${theme.chart.humidity}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.chart.humidity} stopOpacity={0.3} />
            <stop offset="100%" stopColor={theme.chart.humidity} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.chart.grid} />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 10, fill: theme.chart.text }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          yAxisId="temp"
          tick={{ fontSize: 10, fill: theme.chart.text }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `${v}°`}
          domain={['auto', 'auto']}
        />
        <YAxis
          yAxisId="hum"
          orientation="right"
          tick={{ fontSize: 10, fill: theme.chart.text }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `${v}%`}
          domain={[0, 100]}
          hide
        />
        <Tooltip
          contentStyle={{
            background: theme.chart.tooltip,
            border: 'none',
            borderRadius: 8,
            color: theme.chart.tooltipText,
            fontSize: 12,
          }}
          formatter={(value: number, name: string) => {
            if (name === 'temp') return [`${value.toFixed(1)}°C`, 'Temperature'];
            return [`${value}%`, 'Humidity'];
          }}
        />
        <Area
          yAxisId="temp"
          type="monotone"
          dataKey="temp"
          stroke={theme.chart.temperature}
          fill={`url(#tempGrad-${theme.chart.temperature})`}
          strokeWidth={2}
          dot={false}
          animationDuration={800}
        />
        <Area
          yAxisId="hum"
          type="monotone"
          dataKey="humidity"
          stroke={theme.chart.humidity}
          fill={`url(#humGrad-${theme.chart.humidity})`}
          strokeWidth={1.5}
          dot={false}
          animationDuration={800}
          strokeDasharray="4 2"
        />
        {data.length > 30 && (
          <Brush
            dataKey="time"
            height={20}
            stroke={theme.palette.primary.main}
            fill={theme.palette.background.paper}
            travellerWidth={8}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
