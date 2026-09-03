import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TimeScale } from '../api/types';
import { useHistory } from '../hooks/useHistory';
import { downsample } from '../utils/downsample';
import { formatTimestamp } from '../utils/formatTimestamp';
import styles from './TemperatureChart.module.css';

const MAX_POINTS = 300;

interface TemperatureChartProps {
  deviceId: string;
  timeScale: TimeScale;
}

export default function TemperatureChart({ deviceId, timeScale }: TemperatureChartProps) {
  const { data, isLoading, isError } = useHistory(deviceId, timeScale);

  if (isLoading) {
    return <span className={styles.message}>Loading…</span>;
  }

  if (isError || !data?.history.length) {
    return <span className={styles.message}>No data</span>;
  }

  const history = downsample(data.history, MAX_POINTS);
  const chartData = history.map((reading) => ({
    label: formatTimestamp(reading.timestamp, timeScale),
    temperature: reading.temperature,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="rgba(0, 0, 0, 0.05)" />
        <XAxis dataKey="label" fontSize={10} stroke="#777" interval="preserveStartEnd" minTickGap={24} />
        <YAxis fontSize={10} stroke="#777" tickFormatter={(value: number) => `${value}°`} />
        <Tooltip formatter={(value) => `${Number(value).toFixed(1)}°C`} />
        <Area
          type="monotone"
          dataKey="temperature"
          stroke="#d9534f"
          strokeWidth={2}
          dot={history.length <= 100 ? { r: 3, fill: '#d9534f' } : false}
          activeDot={{ r: 5, fill: '#5bc0de' }}
          fill="rgba(217, 83, 79, 0.15)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
