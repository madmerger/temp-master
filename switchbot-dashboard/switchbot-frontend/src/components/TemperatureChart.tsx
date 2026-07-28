import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatTemperature, formatTimestamp } from '../utils/format'
import type { MeterReading, TimeScale } from '../types'

interface TemperatureChartProps {
  history: MeterReading[]
  timeScale: TimeScale
}

interface ChartPoint {
  label: string
  temperature: number
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: ChartPoint }[]
}) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const point = payload[0].payload
  return (
    <div className="chart-tooltip">
      <div>{point.label}</div>
      <div>{formatTemperature(point.temperature)}</div>
    </div>
  )
}

export function TemperatureChart({ history, timeScale }: TemperatureChartProps) {
  const data: ChartPoint[] = history.map((reading) => ({
    label: formatTimestamp(reading.timestamp, timeScale),
    temperature: reading.temperature,
  }))

  return (
    <div className="meter-chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid stroke="var(--chart-grid)" />
          <XAxis
            dataKey="label"
            interval="preserveStartEnd"
            minTickGap={24}
            tick={{ fontSize: 10, fill: 'var(--chart-axis)' }}
            stroke="var(--chart-axis)"
          />
          <YAxis
            domain={['auto', 'auto']}
            tickFormatter={(value: number) => `${value}\u00b0`}
            tick={{ fontSize: 10, fill: 'var(--chart-axis)' }}
            stroke="var(--chart-axis)"
          />
          <Tooltip content={<ChartTooltip />} />
          <Line
            type="monotone"
            dataKey="temperature"
            stroke="var(--chart-line)"
            strokeWidth={2}
            dot={{ r: 2, fill: 'var(--chart-line)' }}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
