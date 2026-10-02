import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import type { Meter, MetersResponse, Status } from './types'

function createMeter(
  deviceId: string,
  name: string,
  lastUpdated: string | null,
): Meter {
  return {
    device_id: deviceId,
    device_name: name,
    device_type: 'Meter',
    current_temperature: 23,
    current_humidity: 50,
    battery: 80,
    last_updated: lastUpdated,
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Internal Server Error',
    json: async () => body,
  } as Response
}

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  )
}

const status: Status = {
  configured: true,
  meters_count: 2,
  is_rate_limited: false,
  backoff_remaining: 0,
  last_api_call: null,
  collection_interval: 120,
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('App', () => {
  it('renders active and stale meters in separate sections and the status count', async () => {
    const meters: MetersResponse = {
      meters: [
        createMeter('active', 'Bedroom Meter', new Date().toISOString()),
        createMeter(
          'stale',
          'Living Meter',
          new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        ),
      ],
      last_updated: null,
    }
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url.endsWith('/api/meters')) return jsonResponse(meters)
        if (url.endsWith('/api/status')) return jsonResponse(status)
        if (url.includes('/history?')) {
          return jsonResponse({
            device_id: 'active',
            time_scale: 'day',
            history: [],
            device: null,
          })
        }
        throw new Error(`Unexpected URL: ${url}`)
      }),
    )

    renderApp()

    expect(await screen.findByText('Monitoring 2 meters')).toBeInTheDocument()
    expect(screen.getByText('第1蒸留塔 (T-101)')).toBeInTheDocument()
    const staleSection = screen.getByRole('heading', { name: /未更新のメーター/ })
      .parentElement?.parentElement
    expect(staleSection).toContainElement(
      screen.getByText('第2蒸留塔 (T-102)'),
    )
  })

  it('shows the rate-limit warning and retry duration', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url.endsWith('/api/meters')) {
          return jsonResponse({ meters: [], last_updated: null })
        }
        if (url.endsWith('/api/status')) {
          return jsonResponse({
            ...status,
            is_rate_limited: true,
            backoff_remaining: 37,
          })
        }
        throw new Error(`Unexpected URL: ${url}`)
      }),
    )

    renderApp()

    expect(await screen.findByText('Rate Limited.')).toBeInTheDocument()
    expect(
      screen.getByText(
        'SwitchBot API rate limit reached. Retry in 37 seconds.',
      ),
    ).toBeInTheDocument()
  })

  it('shows a disconnected state and meters error when the meters endpoint fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url.endsWith('/api/meters')) return jsonResponse({}, 500)
        if (url.endsWith('/api/status')) return jsonResponse(status)
        throw new Error(`Unexpected URL: ${url}`)
      }),
    )

    renderApp()

    expect(await screen.findByText('Disconnected')).toBeInTheDocument()
    expect(
      await screen.findByText('Failed to fetch meters: HTTP 500 Internal Server Error'),
    ).toBeInTheDocument()
  })
})
