import { useEffect, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'
import { fetchHistory } from '../api'
import { formatTimestamp } from '../meters'
import { useTheme } from '../theme'
import type { TimeScale } from '../types'

interface ChartPoint {
  label: string
  temperature: number
}

const THEME_COLORS = {
  light: { line: '#d9534f', grid: 'rgba(0, 0, 0, 0.08)', axis: '#777777' },
  dark: { line: '#ff6b66', grid: 'rgba(255, 255, 255, 0.08)', axis: '#9aa0a6' },
}

function ChartTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) {
    return null
  }
  const value = payload[0].value
  if (value === null || value === undefined) {
    return null
  }
  return <div className="chart-tooltip">{Number(value).toFixed(1)}&deg;C</div>
}

interface Props {
  deviceId: string
  timeScale: TimeScale
}

export function TemperatureChart({ deviceId, timeScale }: Props) {
  const { theme } = useTheme()
  const [data, setData] = useState<ChartPoint[]>([])
  const colors = THEME_COLORS[theme]

  useEffect(() => {
    let cancelled = false
    fetchHistory(deviceId, timeScale)
      .then((resp) => {
        if (cancelled) return
        setData(
          resp.history.map((r) => ({
            label: formatTimestamp(r.timestamp, timeScale),
            temperature: r.temperature,
          })),
        )
      })
      .catch(() => {
        // Clear on error so a failed reload doesn't keep showing the
        // previous time range's data.
        if (!cancelled) setData([])
      })
    return () => {
      cancelled = true
    }
  }, [deviceId, timeScale])

  return (
    <div className="meter-chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
          <CartesianGrid stroke={colors.grid} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: colors.axis }}
            interval="preserveStartEnd"
            minTickGap={20}
          />
          <YAxis
            tick={{ fontSize: 10, fill: colors.axis }}
            tickFormatter={(v: number) => `${v}\u00b0`}
            width={40}
          />
          <Tooltip content={(props) => <ChartTooltip {...props} />} />
          <Line
            type="monotone"
            dataKey="temperature"
            stroke={colors.line}
            strokeWidth={2}
            dot={{ r: 3, fill: colors.line, stroke: colors.line }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
