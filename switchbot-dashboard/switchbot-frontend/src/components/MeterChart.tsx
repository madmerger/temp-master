import { useEffect, useState } from 'react'
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts'
import { fetchHistory } from '../api/client'
import type { HistoryEntry, TimeScale } from '../api/types'
import { formatTimestamp } from '../utils'

interface MeterChartProps {
  deviceId: string
  timeScale: TimeScale
}

interface ChartDataPoint {
  label: string
  temperature: number
}

export function MeterChart({ deviceId, timeScale }: MeterChartProps) {
  const [data, setData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    fetchHistory(deviceId, timeScale)
      .then((res) => {
        if (cancelled) return
        const points = res.history.map((entry: HistoryEntry) => ({
          label: formatTimestamp(entry.timestamp, timeScale),
          temperature: entry.temperature,
        }))
        setData(points)
      })
      .catch(() => {
        if (!cancelled) setData([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [deviceId, timeScale])

  if (loading) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <span className="text-sm text-[var(--color-text-secondary)]">
          Loading chart...
        </span>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <span className="text-sm text-[var(--color-text-secondary)]">
          No data available
        </span>
      </div>
    )
  }

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-chart-grid)"
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
            tickLine={false}
            tickFormatter={(v: number) => `${v}\u00b0`}
            width={35}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              color: 'var(--color-text)',
            }}
            formatter={(value: number) => [`${value.toFixed(1)}\u00b0C`, 'Temperature']}
          />
          <Area
            type="monotone"
            dataKey="temperature"
            fill="var(--color-chart-fill)"
            stroke="none"
          />
          <Line
            type="monotone"
            dataKey="temperature"
            stroke="var(--color-chart-line)"
            strokeWidth={2}
            dot={{ r: 2, fill: 'var(--color-chart-line)' }}
            activeDot={{ r: 5, fill: 'var(--color-primary)' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
