import { useMemo } from 'react'
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { useMeterHistory } from '../hooks/useMeterHistory'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { useTheme } from '../hooks/useTheme'
import { formatTimestamp } from '../lib/format'
import type { TimeScale } from '../types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

interface TemperatureChartProps {
  deviceId: string
  displayName: string
  timeScale: TimeScale
  reloadToken: number
}

export default function TemperatureChart({ deviceId, displayName, timeScale, reloadToken }: TemperatureChartProps) {
  const history = useMeterHistory(deviceId, timeScale, reloadToken)
  const reducedMotion = useReducedMotion()
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme === 'dark'
  const lineColor = dark ? '#f87171' : '#d9534f'
  const fillColor = dark ? 'rgba(248, 113, 113, 0.2)' : 'rgba(217, 83, 79, 0.15)'
  const gridColor = dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
  const tickColor = dark ? '#9ca3af' : '#777'

  const data = useMemo(() => ({
    labels: history.map(({ timestamp }) => formatTimestamp(timestamp, timeScale)),
    datasets: [{
      label: 'Temperature (C)',
      data: history.map(({ temperature }) => temperature),
      borderColor: lineColor,
      backgroundColor: fillColor,
      borderWidth: 2,
      pointRadius: 3,
      pointBackgroundColor: lineColor,
      pointBorderColor: lineColor,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: '#5bc0de',
      fill: true,
      tension: 0.4,
    }],
  }), [fillColor, history, lineColor, timeScale])

  const options = useMemo(() => ({
    animation: reducedMotion ? false as const : undefined,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: (context: { parsed: { y: number | null } }) => {
            const value = context.parsed.y
            return value == null ? '' : `${value.toFixed(1)}°C`
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { maxTicksLimit: 8, font: { size: 10 }, color: tickColor },
      },
      y: {
        grid: { color: gridColor },
        ticks: {
          font: { size: 10 },
          color: tickColor,
          callback: (value: string | number) => `${value}°`,
        },
      },
    },
  }), [gridColor, reducedMotion, tickColor])

  return (
    <div className="relative h-[200px]" data-points={history.length}>
      <Line
        data={data}
        options={options}
        data-testid={`chart-${deviceId}`}
        aria-label={`Temperature history chart for ${displayName}`}
        role="img"
      />
    </div>
  )
}
