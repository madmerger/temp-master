import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { MeterReading, TimeScale } from '../types'
import { formatTimestamp } from '../utils'

interface ChartProps {
  history: MeterReading[]
  timeScale: TimeScale
}

export default function Chart({ history, timeScale }: ChartProps) {
  const data = history.map((reading) => ({
    label: formatTimestamp(reading.timestamp, timeScale),
    temperature: reading.temperature,
  }))

  return (
    <div className="meter-chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 8, left: 0, bottom: 5 }}>
          <CartesianGrid stroke="rgba(0,0,0,0.05)" />
          <XAxis
            dataKey="label"
            interval="preserveStartEnd"
            minTickGap={20}
            tick={{ fontSize: 10, fill: '#777' }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#777' }}
            tickFormatter={(value) => `${value}°`}
          />
          <Tooltip
            labelStyle={{ display: 'none' }}
            formatter={(value) => [`${Number(value).toFixed(1)}°C`, '']}
          />
          <Area
            type="monotone"
            dataKey="temperature"
            stroke="#d9534f"
            strokeWidth={2}
            fill="rgba(217,83,79,0.15)"
            fillOpacity={1}
            dot={{ r: 3, fill: '#d9534f' }}
            activeDot={{ r: 5, fill: '#5bc0de' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
