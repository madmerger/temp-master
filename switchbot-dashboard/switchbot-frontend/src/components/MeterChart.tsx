import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { fetchHistory } from '../api';
import { formatTimestamp } from '../utils';
import type { TimeScale, MeterReading } from '../types';

interface MeterChartProps {
  deviceId: string;
  timeScale: TimeScale;
  refreshKey: number;
}

interface ChartPoint {
  label: string;
  temperature: number;
}

export function MeterChart({ deviceId, timeScale, refreshKey }: MeterChartProps) {
  const [data, setData] = useState<ChartPoint[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchHistory(deviceId, timeScale)
      .then((res) => {
        if (cancelled) return;
        setData(
          res.history.map((r: MeterReading) => ({
            label: formatTimestamp(r.timestamp, timeScale),
            temperature: r.temperature,
          })),
        );
      })
      .catch(() => {
        if (!cancelled) setData([]);
      });
    return () => { cancelled = true; };
  }, [deviceId, timeScale, refreshKey]);

  if (data.length === 0) {
    return <div className="chart-empty">No data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
        <XAxis
          dataKey="label"
          tick={{ fill: '#8a8f98', fontSize: 10 }}
          tickLine={false}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: '#8a8f98', fontSize: 10 }}
          tickLine={false}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          tickFormatter={(v: number) => `${v}\u00b0`}
          width={40}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1e2028',
            border: '1px solid #2d3040',
            borderRadius: '6px',
            color: '#e0e0e0',
          }}
          formatter={(value) => [`${Number(value).toFixed(1)}\u00b0C`, 'Temperature']}
          labelStyle={{ color: '#8a8f98' }}
        />
        <Line
          type="monotone"
          dataKey="temperature"
          stroke="#ef5350"
          strokeWidth={2}
          dot={{ r: 2, fill: '#ef5350' }}
          activeDot={{ r: 5, fill: '#42a5f5' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
