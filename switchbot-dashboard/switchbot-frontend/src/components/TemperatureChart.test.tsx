import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchHistory } from '../api'
import { ThemeProvider } from '../theme/ThemeProvider'
import type { HistoryResponse, Reading, TimeScale } from '../types'
import { TemperatureChart } from './TemperatureChart'

vi.mock('../api', () => ({
  fetchHistory: vi.fn(),
}))

vi.mock('react-chartjs-2', () => ({
  Line: ({ data }: { data: { datasets: { data: unknown[] }[] } }) => (
    <output data-testid="chart-point-count">
      {data.datasets[0]?.data.length ?? 0}
    </output>
  ),
}))

const readings: Reading[] = [
  {
    timestamp: '2024-01-01T00:00:00Z',
    temperature: 20,
    humidity: 40,
  },
  {
    timestamp: '2024-01-01T01:00:00Z',
    temperature: 21,
    humidity: 41,
  },
  {
    timestamp: '2024-01-01T02:00:00Z',
    temperature: 22,
    humidity: 42,
  },
]

function historyResponse(timeScale: TimeScale): HistoryResponse {
  return {
    device_id: 'device-1',
    time_scale: timeScale,
    history: readings,
    device: null,
  }
}

function renderChart(timeScale: TimeScale, refreshToken = 0) {
  return render(
    <ThemeProvider>
      <TemperatureChart
        deviceId="device-1"
        timeScale={timeScale}
        refreshToken={refreshToken}
      />
    </ThemeProvider>,
  )
}

describe('TemperatureChart', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    window.localStorage.clear()
  })

  beforeEach(() => {
    window.localStorage.clear()
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    )
  })

  it('hides readings from another time scale when the new fetch fails', async () => {
    let reject!: (error: unknown) => void
    const failedFetch = new Promise<HistoryResponse>((_, rejectPromise) => {
      reject = rejectPromise
    })
    vi.mocked(fetchHistory)
      .mockResolvedValueOnce(historyResponse('day'))
      .mockReturnValueOnce(failedFetch)

    const { rerender } = renderChart('day')
    await waitFor(() =>
      expect(screen.getByTestId('chart-point-count')).toHaveTextContent('3'),
    )

    rerender(
      <ThemeProvider>
        <TemperatureChart
          deviceId="device-1"
          timeScale="week"
          refreshToken={0}
        />
      </ThemeProvider>,
    )

    await waitFor(() => expect(fetchHistory).toHaveBeenCalledTimes(2))
    expect(screen.getByTestId('chart-point-count')).toHaveTextContent('0')
    await act(async () => {
      reject(new Error('network error'))
      await Promise.resolve()
    })
    expect(screen.getByTestId('chart-point-count')).toHaveTextContent('0')
  })

  it('keeps readings when a refresh fetch fails for the same key', async () => {
    let reject!: (error: unknown) => void
    const failedFetch = new Promise<HistoryResponse>((_, rejectPromise) => {
      reject = rejectPromise
    })
    vi.mocked(fetchHistory)
      .mockResolvedValueOnce(historyResponse('day'))
      .mockReturnValueOnce(failedFetch)

    const { rerender } = renderChart('day')
    await waitFor(() =>
      expect(screen.getByTestId('chart-point-count')).toHaveTextContent('3'),
    )

    rerender(
      <ThemeProvider>
        <TemperatureChart
          deviceId="device-1"
          timeScale="day"
          refreshToken={1}
        />
      </ThemeProvider>,
    )

    await waitFor(() => expect(fetchHistory).toHaveBeenCalledTimes(2))
    await act(async () => {
      reject(new Error('network error'))
      await Promise.resolve()
    })
    expect(screen.getByTestId('chart-point-count')).toHaveTextContent('3')
  })
})
