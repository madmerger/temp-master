import { useEffect, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { MeterReading, TimeScale } from '../api/types'
import { formatTimestamp } from '../utils/meter'
import { chartColors, type Theme } from '../theme'

export function TemperatureChart({ history, timeScale }: { history: MeterReading[]; timeScale: TimeScale }) {
  const [theme, setTheme] = useState<Theme>((document.documentElement.dataset.theme as Theme) || 'light')
  useEffect(() => {
    const observer = new MutationObserver(() => setTheme((document.documentElement.dataset.theme as Theme) || 'light'))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])
  const colors = chartColors[theme]
  const data = history.map((reading) => ({ ...reading, label: formatTimestamp(reading.timestamp, timeScale) }))
  return <div className="chart-wrap">
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
        <XAxis dataKey="label" stroke={colors.axis} tick={{ fontSize: 10 }} interval={Math.max(0, Math.ceil(data.length / 8) - 1)} />
        <YAxis stroke={colors.axis} tick={{ fontSize: 10 }} tickFormatter={(value) => `${value}°`} />
        <Tooltip contentStyle={{ background: colors.tooltip, borderColor: colors.grid, color: colors.axis }} formatter={(value) => [`${Number(value).toFixed(1)}°C`, 'Temperature']} />
        <Line type="monotone" dataKey="temperature" stroke={colors.line} strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5 }} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  </div>
}
