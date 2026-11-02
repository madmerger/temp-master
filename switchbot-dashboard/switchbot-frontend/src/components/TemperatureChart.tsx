import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { useEffect, useMemo, useState } from 'react'
import { Line } from 'react-chartjs-2'
import { fetchHistory } from '../api'
import type { Reading, TimeScale } from '../types'
import { formatTemperatureTick, formatTimestamp } from '../utils/format'
import { CHART_THEME } from '../theme/chartTheme'
import { useTheme } from '../theme/useTheme'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

interface TemperatureChartProps {
  deviceId: string
  timeScale: TimeScale
  refreshToken: number
}

export function TemperatureChart({
  deviceId,
  timeScale,
  refreshToken,
}: TemperatureChartProps) {
  const [history, setHistory] = useState<Reading[]>([])
  const { theme } = useTheme()
  const palette = CHART_THEME[theme]

  useEffect(() => {
    const controller = new AbortController()
    void fetchHistory(deviceId, timeScale, controller.signal)
      .then((response) => setHistory(response.history || []))
      .catch(() => {})
    return () => controller.abort()
  }, [deviceId, timeScale, refreshToken])

  const data = useMemo<ChartData<'line'>>(
    () => ({
      labels: history.map((reading) =>
        formatTimestamp(reading.timestamp, timeScale),
      ),
      datasets: [
        {
          label: 'Temperature (C)',
          data: history.map((reading) => reading.temperature),
          borderColor: '#d9534f',
          backgroundColor: 'rgba(217, 83, 79, 0.15)',
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#d9534f',
          pointBorderColor: '#d9534f',
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
            label: (context) =>
              context.parsed.y === null
                ? ''
                : `${context.parsed.y.toFixed(1)}°C`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: palette.grid },
          ticks: {
            maxTicksLimit: 8,
            font: { size: 10 },
            color: palette.tick,
          },
        },
        y: {
          grid: { color: palette.grid },
          ticks: {
            font: { size: 10 },
            color: palette.tick,
            callback: (value) => formatTemperatureTick(value),
          },
        },
      },
    }),
    [palette],
  )

  return <Line data={data} options={options} />
}
