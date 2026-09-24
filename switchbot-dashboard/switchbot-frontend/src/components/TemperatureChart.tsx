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
import { fetchHistory, type HistoryPoint, type TimeScale } from '../api'
import { formatTimestamp } from '../utils/format'

interface Props {
  deviceId: string
  timeScale: TimeScale
  refreshKey: number
}

const COLOR = '#d9534f'

export function TemperatureChart({ deviceId, timeScale, refreshKey }: Props) {
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchHistory(deviceId, timeScale)
      .then((res) => {
        if (!cancelled) {
          setHistory(res.history ?? [])
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      })
    return () => {
      cancelled = true
    }
  }, [deviceId, timeScale, refreshKey])

  if (error) {
    return <p className="text-muted small mb-0">履歴の取得に失敗しました: {error}</p>
  }

  const data = history.map((p) => ({
    ...p,
    label: formatTimestamp(p.timestamp, timeScale),
  }))

  return (
    <div className="meter-chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid stroke="rgba(0, 0, 0, 0.05)" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#777' }} interval="preserveStartEnd" minTickGap={24} />
          <YAxis
            tick={{ fontSize: 10, fill: '#777' }}
            tickFormatter={(v: number) => `${v}\u00b0`}
            domain={['auto', 'auto']}
            width={40}
          />
          <Tooltip
            formatter={(v) => [typeof v === 'number' ? `${v.toFixed(1)}\u00b0C` : '', 'Temperature']}
          />
          <Line
            type="monotone"
            dataKey="temperature"
            stroke={COLOR}
            strokeWidth={2}
            dot={{ r: 3, fill: COLOR, stroke: COLOR }}
            activeDot={{ r: 5, fill: '#5bc0de' }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
