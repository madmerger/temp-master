import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import { formatTimestamp } from '../lib/meters'
import { useTheme } from '../lib/theme-context'
import type { HistoryPoint, TimeScale } from '../types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

interface Props {
  history: HistoryPoint[]
  timeScale: TimeScale
}

export function TemperatureChart({ history, timeScale }: Props) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // 軸・グリッド・線色はテーマに応じて切り替える
  const tickColor = isDark ? '#9ca3af' : '#777777'
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'
  const lineColor = isDark ? '#f87171' : '#d9534f'
  const fillColor = isDark ? 'rgba(248, 113, 113, 0.18)' : 'rgba(217, 83, 79, 0.15)'

  const data = useMemo<ChartData<'line'>>(
    () => ({
      labels: history.map((point) => formatTimestamp(point.timestamp, timeScale)),
      datasets: [
        {
          label: 'Temperature (C)',
          data: history.map((point) => point.temperature),
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
        },
      ],
    }),
    [history, timeScale, lineColor, fillColor],
  )

  const options = useMemo<ChartOptions<'line'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (item) => {
              const value = item.parsed.y
              return value === null || value === undefined ? '' : `${value.toFixed(1)}\u00b0C`
            },
          },
        },
      },
      scales: {
        x: {
          display: true,
          grid: { display: true, color: gridColor },
          ticks: { maxTicksLimit: 8, font: { size: 10 }, color: tickColor },
        },
        y: {
          display: true,
          grid: { display: true, color: gridColor },
          ticks: {
            font: { size: 10 },
            color: tickColor,
            callback: (value) => `${value}\u00b0`,
          },
        },
      },
    }),
    [gridColor, tickColor],
  )

  return (
    <div className="relative h-[200px]">
      <Line data={data} options={options} />
    </div>
  )
}
