import { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import { chartTheme } from '../lib/chartTheme'
import { formatTimestamp } from '../lib/format'
import { useTheme } from '../theme/useTheme'
import type { MeterReading, TimeScale } from '../types'
import type { ChartOptions } from 'chart.js'

interface MeterChartProps {
  history: MeterReading[]
  timeScale: TimeScale
}

export function MeterChart({ history, timeScale }: MeterChartProps) {
  const { theme } = useTheme()
  const data = useMemo(
    () => ({
      labels: history.map((reading) => formatTimestamp(reading.timestamp, timeScale)),
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
  const options = useMemo<ChartOptions<'line'>>(() => {
    const palette = chartTheme[theme]
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: palette.tooltipBg,
          titleColor: palette.tooltipText,
          bodyColor: palette.tooltipText,
          callbacks: {
            label: (context) => {
              const value = context.parsed.y
              if (value === null || value === undefined) return ''
              return `${value.toFixed(1)}°C`
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: true, color: palette.grid },
          ticks: {
            maxTicksLimit: 8,
            font: { size: 10 },
            color: palette.tick,
          },
        },
        y: {
          grid: { display: true, color: palette.grid },
          ticks: {
            font: { size: 10 },
            color: palette.tick,
            callback: (value) => `${value}°`,
          },
        },
      },
    }
  }, [theme])

  return <Line data={data} options={options} />
}
