import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Reading, TimeScale } from '../api/types';
import { useTheme } from '../hooks/useTheme';
import { formatTimestamp } from '../utils/format';

export default function TemperatureChart({ readings, timeScale }: { readings: Reading[]; timeScale: TimeScale }) {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const axis = dark ? '#9ca3af' : '#777';
  const grid = dark ? '#374151' : '#e5e7eb';
  const line = dark ? '#f87171' : '#d9534f';
  const data = readings.map((reading) => ({
    ...reading,
    label: formatTimestamp(reading.timestamp, timeScale),
  }));

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={grid} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={{ fill: axis, fontSize: 10 }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: axis, fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']}
            tickFormatter={(value: number) => `${value.toFixed(1)}°`}
            width={44}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: dark ? '#1f2937' : '#fff',
              borderColor: grid,
              color: dark ? '#f9fafb' : '#111827',
            }}
            formatter={(value: unknown) => {
              if (typeof value !== 'number') {
                return ['', 'Temperature'];
              }
              return [`${value.toFixed(1)}°C`, 'Temperature'];
            }}
          />
          <Line
            type="monotone"
            dataKey="temperature"
            stroke={line}
            strokeWidth={2}
            dot={{ r: 3, fill: line }}
            activeDot={{ r: 5, fill: dark ? '#38bdf8' : '#5bc0de' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
