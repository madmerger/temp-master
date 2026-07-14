import { useEffect, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fetchHistory } from '../api'
import { useTheme } from '../theme/ThemeContext'
import { getChartColors } from '../theme/chartColors'
import type { TimeScale } from '../types'
import { formatTimestamp } from '../utils'

interface ChartPoint {
  label: string
  temperature: number
}

// Cap the number of points drawn so charts stay responsive even when the
// backend returns tens of thousands of readings for a long time scale.
const MAX_POINTS = 240

function downsample<T>(items: T[], max: number): T[] {
  if (items.length <= max) {
    return items
  }
  const step = (items.length - 1) / (max - 1)
  const result: T[] = []
  for (let i = 0; i < max; i++) {
    result.push(items[Math.round(i * step)])
  }
  return result
}

interface TemperatureChartProps {
  deviceId: string
  timeScale: TimeScale
  reloadKey: number
}

export function TemperatureChart({
  deviceId,
  timeScale,
  reloadKey,
}: TemperatureChartProps) {
  const { theme } = useTheme()
  const colors = getChartColors(theme)
  const [data, setData] = useState<ChartPoint[]>([])

  useEffect(() => {
    let cancelled = false
    fetchHistory(deviceId, timeScale)
      .then((resp) => {
        if (cancelled) return
        const points = downsample(resp.history ?? [], MAX_POINTS).map(
          (reading) => ({
            label: formatTimestamp(reading.timestamp, timeScale),
            temperature: reading.temperature,
          }),
        )
        setData(points)
      })
      .catch(() => {
        /* history fetch errors are non-fatal; leave the chart empty */
      })
    return () => {
      cancelled = true
    }
  }, [deviceId, timeScale, reloadKey])

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -12 }}>
          <CartesianGrid stroke={colors.grid} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: colors.axis }}
            stroke={colors.grid}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 10, fill: colors.axis }}
            stroke={colors.grid}
            width={40}
            tickFormatter={(v: number) => `${v}\u00b0`}
          />
          <Tooltip
            contentStyle={{
              background: colors.tooltipBg,
              border: `1px solid ${colors.tooltipBorder}`,
              borderRadius: 8,
              color: colors.tooltipText,
              fontSize: 12,
            }}
            labelStyle={{ color: colors.tooltipText }}
            formatter={(value: number | string) => {
              const num = typeof value === 'number' ? value : Number(value)
              return [`${num.toFixed(1)}\u00b0C`, 'Temperature']
            }}
          />
          <Line
            type="monotone"
            dataKey="temperature"
            stroke={colors.line}
            strokeWidth={2}
            fill={colors.fill}
            dot={{ r: 2, fill: colors.line }}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
