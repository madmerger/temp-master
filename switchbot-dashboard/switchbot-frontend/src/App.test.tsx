import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { ThemeProvider } from './theme/ThemeProvider'

vi.mock('react-chartjs-2', () => ({
  Line: () => <canvas data-testid="chart" />,
}))

function response(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    headers: { get: () => null },
  } as unknown as Response
}

const status = {
  configured: true,
  meters_count: 2,
  is_rate_limited: true,
  backoff_remaining: 42,
  last_api_call: null,
  collection_interval: 120,
}

function renderApp() {
  return render(
    <ThemeProvider>
      <App />
    </ThemeProvider>,
  )
}

describe('dashboard integration', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    window.localStorage.clear()
  })

  beforeEach(() => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    )
  })

  it('separates fresh and stale meters and shows status and rate limiting', async () => {
    const staleDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url.endsWith('/api/meters')) {
          return response({
            meters: [
              {
                device_id: 'fresh-id',
                device_name: 'Bedroom Meter',
                device_type: 'Meter',
                current_temperature: 21.5,
                current_humidity: 45,
                battery: 90,
                last_updated: new Date().toISOString(),
              },
              {
                device_id: 'stale-id',
                device_name: 'Unmapped Stale Meter',
                device_type: 'Meter',
                current_temperature: null,
                current_humidity: null,
                battery: null,
                last_updated: staleDate,
              },
            ],
            last_updated: new Date().toISOString(),
          })
        }
        if (url.endsWith('/api/status')) {
          return response(status)
        }
        return response({
          device_id: 'fresh-id',
          time_scale: 'day',
          history: [],
          device: null,
        })
      }),
    )

    renderApp()

    const cards = await screen.findAllByTestId('meter-card')
    const freshCard = cards.find(
      (card) => card.getAttribute('data-device-id') === 'fresh-id',
    )
    expect(freshCard).toBeDefined()
    if (!freshCard) {
      throw new Error('Fresh meter card did not render')
    }
    expect(freshCard).toHaveAttribute('data-device-id', 'fresh-id')
    expect(within(freshCard).getByText('第1蒸留塔 (T-101)')).toBeInTheDocument()
    expect(within(freshCard).queryByText('7日以上未更新')).not.toBeInTheDocument()

    const staleSection = screen.getByRole('region', { name: '未更新のメーター' })
    const staleCard = within(staleSection).getByTestId('meter-card')
    expect(staleCard).toHaveAttribute('data-device-id', 'stale-id')
    expect(within(staleCard).getByText('7日以上未更新')).toBeInTheDocument()
    expect(
      within(staleCard).getByText('履歴データの取得対象外'),
    ).toBeInTheDocument()
    expect(screen.getByText('Monitoring 2 meters')).toBeInTheDocument()
    expect(screen.getByText(/Retry in 42 seconds\./)).toBeInTheDocument()
    expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected')
  })

  it('shows a prefixed error and disconnected status when meters fail', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) =>
        String(input).endsWith('/api/meters')
          ? response({}, 500)
          : response(status),
      ),
    )

    renderApp()

    expect(await screen.findByText('Error.')).toBeInTheDocument()
    expect(
      screen.getByText('Failed to fetch meters: HTTP 500'),
    ).toBeInTheDocument()
    expect(screen.getByTestId('connection-status')).toHaveTextContent(
      'Disconnected',
    )
  })
})
