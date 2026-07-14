import { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fetchHistory } from '../api/client'
import type { TimeScale } from '../types'
import { formatTimestamp } from '../utils/format'

interface MeterChartProps {
  deviceId: string
  timeScale: TimeScale
  refreshTick: number
}

interface ChartPoint {
  label: string
  temperature: number
}

function TooltipContent({ active, payload }: {
  active?: boolean
  payload?: { payload: ChartPoint }[]
}) {
  if (!active || !payload || payload.length === 0) {
    return null
  }
  const point = payload[0].payload
  return (
    <div
      style={{
        background: 'var(--chart-tooltip-bg)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '6px 10px',
        color: 'var(--text)',
        fontSize: 12,
        boxShadow: 'var(--shadow)',
      }}
    >
      <div style={{ color: 'var(--text-muted)' }}>{point.label}</div>
      <div style={{ fontWeight: 600 }}>{point.temperature.toFixed(1)}°C</div>
    </div>
  )
}

export default function MeterChart({ deviceId, timeScale, refreshTick }: MeterChartProps) {
  const [data, setData] = useState<ChartPoint[]>([])

  useEffect(() => {
    let cancelled = false
    fetchHistory(deviceId, timeScale)
      .then((resp) => {
        if (cancelled) return
        const points = (resp.history ?? []).map((reading) => ({
          label: formatTimestamp(reading.timestamp, timeScale),
          temperature: reading.temperature,
        }))
        setData(points)
      })
      .catch(() => {
        /* keep previous data on error */
      })
    return () => {
      cancelled = true
    }
  }, [deviceId, timeScale, refreshTick])

  return (
    <div style={{ width: '100%', height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id={`grad-${deviceId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-line)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--chart-line)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--chart-axis)', fontSize: 10 }}
            stroke="var(--chart-grid)"
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            tick={{ fill: 'var(--chart-axis)', fontSize: 10 }}
            stroke="var(--chart-grid)"
            width={40}
            tickFormatter={(v: number) => `${v}°`}
          />
          <Tooltip content={<TooltipContent />} />
          <Area
            type="monotone"
            dataKey="temperature"
            stroke="var(--chart-line)"
            strokeWidth={2}
            fill={`url(#grad-${deviceId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
