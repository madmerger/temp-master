import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useMeterHistory } from '../hooks/useMeterHistory'
import type { Meter, TimeScale } from '../types'
import { formatTimestamp } from '../utils/formatTimestamp'

interface TemperatureChartProps {
  meter: Meter
  timeScale: TimeScale
}

export function TemperatureChart({ meter, timeScale }: TemperatureChartProps) {
  const historyQuery = useMeterHistory(meter.device_id, timeScale)
  const data = (historyQuery.data?.history ?? []).map((reading) => ({
    ...reading,
    label: formatTimestamp(reading.timestamp, timeScale),
  }))
  const tickInterval = Math.max(0, Math.ceil(data.length / 8) - 1)

  return (
    <div className="h-[200px] w-full">
      {historyQuery.isError ? null : (
        <ResponsiveContainer height="100%" minHeight={1} width="100%">
          <AreaChart data={data}>
            <CartesianGrid stroke="rgba(0,0,0,0.05)" />
            <XAxis
              dataKey="label"
              interval={tickInterval}
              tick={{ fontSize: 10, fill: '#777' }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#777' }}
              tickFormatter={(value: number | string) => `${value}°`}
            />
            <Tooltip
              formatter={(value) =>
                value === null || value === undefined
                  ? ''
                  : `${Number(value).toFixed(1)}°C`
              }
            />
            <Area
              activeDot={{ r: 5, fill: '#5bc0de' }}
              dataKey="temperature"
              dot={{ r: 3, fill: '#d9534f' }}
              fill="rgba(217,83,79,0.15)"
              stroke="#d9534f"
              strokeWidth={2}
              type="monotone"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
