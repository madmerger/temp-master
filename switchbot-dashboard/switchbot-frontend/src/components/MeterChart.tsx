import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LineElement,
  LinearScale,
  PointElement,
  Ticks,
  Tooltip,
  type ChartOptions,
} from 'chart.js'
import { useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import { fetchHistory } from '../api'
import type { MeterReading, TimeScale } from '../types'
import { formatTimestamp } from '../utils'
import type { Theme } from '../theme'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

interface MeterChartProps {
  deviceId: string
  timeScale: TimeScale
  refreshTick: number
  theme: Theme
}

interface HistoryState {
  deviceId: string
  timeScale: TimeScale
  readings: MeterReading[]
}

export function MeterChart({ deviceId, timeScale, refreshTick, theme }: MeterChartProps) {
  const [historyState, setHistoryState] = useState<HistoryState>({
    deviceId,
    timeScale,
    readings: [],
  })
  const readings = historyState.deviceId === deviceId && historyState.timeScale === timeScale
    ? historyState.readings
    : []

  useEffect(() => {
    const controller = new AbortController()
    fetchHistory(deviceId, timeScale, controller.signal)
      .then((response) => {
        setHistoryState({ deviceId, timeScale, readings: response.history ?? [] })
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }
        setHistoryState({ deviceId, timeScale, readings: [] })
      })

    return () => controller.abort()
  }, [deviceId, refreshTick, timeScale])

  const palette = getComputedStyle(document.documentElement)
  const line = palette.getPropertyValue('--chart-line').trim()
  const fill = palette.getPropertyValue('--chart-fill').trim()
  const grid = palette.getPropertyValue('--chart-grid').trim()
  const tick = palette.getPropertyValue('--chart-tick').trim()
  const pointHover = palette.getPropertyValue('--chart-point-hover').trim()
  const labels = readings.map((reading) => formatTimestamp(reading.timestamp, timeScale))

  const data = {
    labels,
    datasets: [{
      label: 'Temperature (C)',
      data: readings.map((reading) => reading.temperature),
      borderColor: line,
      backgroundColor: fill,
      borderWidth: 2,
      pointRadius: 3,
      pointBackgroundColor: line,
      pointBorderColor: line,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: pointHover,
      fill: true,
      tension: 0.4,
    }],
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => context.parsed.y === null ? '' : `${context.parsed.y.toFixed(1)}°C`,
        },
      },
    },
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: {
        grid: { color: grid },
        ticks: { maxTicksLimit: 8, font: { size: 10 }, color: tick },
      },
      y: {
        grid: { color: grid },
        ticks: {
          font: { size: 10 },
          color: tick,
          callback(value, index, ticks) {
            return `${Ticks.formatters.numeric.call(this, value as number, index, ticks)}°`
          },
        },
      },
    },
  }

  return (
    <div id={`chart-${deviceId}`} className="relative h-[200px]">
      <Line key={theme} data={data} options={options} />
    </div>
  )
}
