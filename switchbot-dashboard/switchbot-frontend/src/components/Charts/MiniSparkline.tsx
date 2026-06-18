import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useTheme } from '@mui/material';
import type { MeterReading } from '../../types';

interface MiniSparklineProps {
  history: MeterReading[];
  dataKey: 'temperature' | 'humidity';
}

export default function MiniSparkline({ history, dataKey }: MiniSparklineProps) {
  const theme = useTheme();

  const color =
    dataKey === 'temperature' ? theme.chart.temperature : theme.chart.humidity;
  const fillColor =
    dataKey === 'temperature'
      ? theme.chart.temperatureFill
      : theme.chart.humidityFill;

  const data = history.slice(-20).map((r) => ({ v: r[dataKey] }));

  if (data.length < 2) return null;

  return (
    <ResponsiveContainer width="100%" height={30}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          fill={fillColor}
          strokeWidth={1.5}
          dot={false}
          animationDuration={600}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
