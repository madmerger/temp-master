import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { MeterReading, TimeScale } from '../types'

interface TemperatureChartProps {
  history: MeterReading[]
  timeScale: TimeScale
  darkMode: boolean
}

export function formatTimestamp(timestamp: string, timeScale: TimeScale): string {
  const date = new Date(timestamp)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const dayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]
  const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()]
  switch (timeScale) {
    case 'hour':
    case 'day':
      return `${hours}:${minutes}`
    case 'week':
      return `${dayShort} ${hours}`
    case 'month':
    case 'year':
      return `${monthShort} ${date.getDate()}`
  }
}

export function TemperatureChart({ history, timeScale, darkMode }: TemperatureChartProps) {
  const axisColor = darkMode ? '#94a3b8' : '#64748b'
  const gridColor = darkMode ? '#334155' : '#e2e8f0'
  const data = history.map((reading) => ({ ...reading, label: formatTimestamp(reading.timestamp, timeScale) }))
  if (!data.length) return <div className="flex h-52 items-center justify-center text-sm text-slate-400">No history available</div>
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 4 }}>
          <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fill: axisColor, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(value: number) => `${value}°`} />
          <Tooltip
            contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', border: `1px solid ${gridColor}`, borderRadius: 10, color: darkMode ? '#f8fafc' : '#172033' }}
            formatter={(value: number) => [`${value.toFixed(1)}°C`, 'Temperature']}
          />
          <Line type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} dot={{ r: 2.5, fill: '#ef4444' }} activeDot={{ r: 5, fill: '#06b6d4' }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
