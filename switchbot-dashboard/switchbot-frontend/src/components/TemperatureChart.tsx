import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useHistory } from '../hooks/useHistory'
import { useTheme } from '../hooks/useTheme'
import { formatTimestamp } from '../utils/formatTimestamp'
import type { TimeScale } from '../api/types'

interface TemperatureChartProps {
  deviceId: string
  timeScale: TimeScale
}

interface ChartPoint {
  label: string
  temperature: number
}

interface TemperatureTooltipPayload {
  value?: number | string
}

interface TemperatureTooltipProps {
  active?: boolean
  payload?: TemperatureTooltipPayload[]
  label?: string
}

function TemperatureTooltip({ active, payload, label }: TemperatureTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const value = payload[0].value
  if (typeof value !== 'number') {
    return null
  }

  const formatted = `${value.toFixed(1)}°C`

  return (
    <div className="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 shadow-sm text-xs">
      <div className="text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className="text-gray-900 dark:text-gray-100">
        Temperature: <span className="font-semibold">{formatted}</span>
      </div>
    </div>
  )
}

export default function TemperatureChart({ deviceId, timeScale }: TemperatureChartProps) {
  const { data } = useHistory(deviceId, timeScale)
  const { isDark } = useTheme()

  const history = data?.history ?? []
  const chartData: ChartPoint[] = history.map((reading) => ({
    label: formatTimestamp(reading.timestamp, timeScale),
    temperature: reading.temperature,
  }))

  const axisColor = isDark ? '#9ca3af' : '#6b7280'
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
  const lineColor = isDark ? '#f87171' : '#d9534f'
  const fillColor = isDark ? 'rgba(248, 113, 113, 0.15)' : 'rgba(217, 83, 79, 0.15)'

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
        <CartesianGrid stroke={gridColor} />
        <XAxis
          dataKey="label"
          tick={{ fill: axisColor, fontSize: 10 }}
          tickMargin={4}
          minTickGap={30}
        />
        <YAxis
          tick={{ fill: axisColor, fontSize: 10 }}
          tickFormatter={(value) => `${value}°`}
          domain={['auto', 'auto']}
        />
        <Tooltip content={<TemperatureTooltip />} />
        <Area
          type="monotone"
          dataKey="temperature"
          stroke={lineColor}
          fill={fillColor}
          strokeWidth={2}
          dot={{ r: 3, fill: lineColor, stroke: lineColor }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
