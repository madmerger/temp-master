import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts'
import { useId } from 'react'
import { useTheme } from '../theme'
import type { MeterReading, TimeScale } from '../types'
import { formatTimestamp } from '../utils'

interface Props {
  history: MeterReading[]
  timeScale: TimeScale
}

interface ChartPoint {
  label: string
  temperature: number
}

function TempTooltip({ active, payload }: TooltipProps<number, string>) {
  const { theme } = useTheme()
  if (!active || !payload || payload.length === 0) return null
  const value = payload[0].value
  if (value === null || value === undefined) return null
  return (
    <div
      style={{
        backgroundColor: theme.chart.tooltipBg,
        color: theme.chart.tooltipText,
        border: `1px solid ${theme.chart.grid}`,
        borderRadius: 6,
        padding: '6px 10px',
        fontSize: 12,
      }}
    >
      {payload[0].payload.label}: {value.toFixed(1)}°C
    </div>
  )
}

export default function TemperatureChart({ history, timeScale }: Props) {
  const { theme } = useTheme()
  const { chart } = theme
  // Unique per chart instance so multiple charts don't share one gradient <def> id.
  const gradientId = `fill-${useId().replace(/:/g, '')}`

  if (!history || history.length === 0) {
    return <div className="chart-empty">No history data</div>
  }

  const data: ChartPoint[] = history.map((h) => ({
    label: formatTimestamp(h.timestamp, timeScale),
    temperature: h.temperature,
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={chart.line} stopOpacity={0.4} />
            <stop offset="100%" stopColor={chart.line} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={chart.grid} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: chart.axis, fontSize: 10 }}
          stroke={chart.grid}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          tick={{ fill: chart.axis, fontSize: 10 }}
          stroke={chart.grid}
          width={40}
          tickFormatter={(v: number) => `${v}°`}
        />
        <Tooltip content={<TempTooltip />} />
        <Area
          type="monotone"
          dataKey="temperature"
          stroke={chart.line}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={{ r: 2, fill: chart.line }}
          activeDot={{ r: 4 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
