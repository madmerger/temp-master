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
import type { HistoryPoint, TimeScale } from '../types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

const TICK_COLOR = '#777777'
const GRID_COLOR = 'rgba(0, 0, 0, 0.05)'
const LINE_COLOR = '#d9534f'
const FILL_COLOR = 'rgba(217, 83, 79, 0.15)'

interface Props {
  history: HistoryPoint[]
  timeScale: TimeScale
}

export function TemperatureChart({ history, timeScale }: Props) {
  const data = useMemo<ChartData<'line'>>(
    () => ({
      labels: history.map((point) => formatTimestamp(point.timestamp, timeScale)),
      datasets: [
        {
          label: 'Temperature (C)',
          data: history.map((point) => point.temperature),
          borderColor: LINE_COLOR,
          backgroundColor: FILL_COLOR,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: LINE_COLOR,
          pointBorderColor: LINE_COLOR,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#5bc0de',
          fill: true,
          tension: 0.4,
        },
      ],
    }),
    [history, timeScale],
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
          grid: { display: true, color: GRID_COLOR },
          ticks: { maxTicksLimit: 8, font: { size: 10 }, color: TICK_COLOR },
        },
        y: {
          display: true,
          grid: { display: true, color: GRID_COLOR },
          ticks: {
            font: { size: 10 },
            color: TICK_COLOR,
            callback: (value) => `${value}\u00b0`,
          },
        },
      },
    }),
    [],
  )

  return (
    <div className="relative h-[200px]">
      <Line data={data} options={options} />
    </div>
  )
}
