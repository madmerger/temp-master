import { useEffect, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { fetchHistory } from '../api'
import type { TimeScale } from '../types'
import { formatTimestamp } from '../utils'

const MAX_X_TICKS = 8
const LINE_COLOR = '#d9534f'
const GRID_COLOR = 'rgba(0, 0, 0, 0.05)'
const TICK_STYLE = { fontSize: 10, fill: '#777' }

interface ChartPoint {
  label: string
  temperature: number
}

interface MeterChartProps {
  deviceId: string
  timeScale: TimeScale
  refreshToken: number
}

export default function MeterChart({ deviceId, timeScale, refreshToken }: MeterChartProps) {
  const [points, setPoints] = useState<ChartPoint[]>([])

  useEffect(() => {
    let cancelled = false
    fetchHistory(deviceId, timeScale)
      .then((data) => {
        if (cancelled) return
        const history = data && data.history ? data.history : []
        setPoints(
          history.map((reading) => ({
            label: formatTimestamp(reading.timestamp, timeScale),
            temperature: reading.temperature,
          })),
        )
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [deviceId, timeScale, refreshToken])

  const tickInterval = Math.max(0, Math.ceil(points.length / MAX_X_TICKS) - 1)

  return (
    <div className="meter-chart-wrap relative h-[200px]" data-testid={`chart-${deviceId}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
          <CartesianGrid stroke={GRID_COLOR} />
          <XAxis dataKey="label" tick={TICK_STYLE} interval={tickInterval} stroke="#ccc" />
          <YAxis
            tick={TICK_STYLE}
            tickFormatter={(value: number) => `${value}\u00b0`}
            domain={['auto', 'auto']}
            stroke="#ccc"
          />
          <Tooltip
            formatter={(value) => [typeof value === 'number' ? `${value.toFixed(1)}\u00b0C` : '', 'Temperature']}
          />
          <Line
            type="monotone"
            dataKey="temperature"
            stroke={LINE_COLOR}
            strokeWidth={2}
            dot={{ r: 3, fill: LINE_COLOR, stroke: LINE_COLOR }}
            activeDot={{ r: 5, fill: '#5bc0de', stroke: LINE_COLOR }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
