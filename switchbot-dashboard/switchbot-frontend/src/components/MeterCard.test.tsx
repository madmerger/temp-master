import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchHistory } from '../api/client'
import type { Meter } from '../types'
import { MeterCard } from './MeterCard'

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/client')>()
  return {
    ...actual,
    fetchHistory: vi.fn().mockResolvedValue({
      device_id: 'meter-1',
      time_scale: 'day',
      history: [],
      device: null,
    }),
  }
})

const activeMeter: Meter = {
  device_id: 'meter-1',
  device_name: '夢男',
  device_type: 'Meter',
  current_temperature: 24.1,
  current_humidity: 58,
  battery: 91,
  last_updated: new Date().toISOString(),
}

function renderCard(meter: Meter, isStale = false) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MeterCard isStale={isStale} meter={meter} timeScale="day" />
    </QueryClientProvider>,
  )
}

describe('MeterCard', () => {
  beforeEach(() => {
    vi.mocked(fetchHistory).mockClear()
  })

  it('maps the display name, shows the device type and non-null values', async () => {
    renderCard(activeMeter)

    expect(screen.getByText('熱交換器 (E-301)')).toBeInTheDocument()
    expect(screen.getByText('Meter')).toBeInTheDocument()
    expect(screen.getByText('24.1°C')).toBeInTheDocument()
    expect(screen.getByText('58%')).toBeInTheDocument()
    expect(screen.getByText('91%')).toBeInTheDocument()
    await screen.findByText(/Last updated:/)
  })

  it('omits null values', () => {
    renderCard({
      ...activeMeter,
      current_temperature: null,
      current_humidity: null,
      battery: null,
    })

    expect(screen.queryByText(/°C$/)).not.toBeInTheDocument()
    expect(screen.queryByText(/%$/)).not.toBeInTheDocument()
  })

  it('excludes stale meters from history and shows the stale state', () => {
    renderCard(
      { ...activeMeter, last_updated: null },
      true,
    )

    expect(screen.getByText('7日以上未更新')).toBeInTheDocument()
    expect(screen.getByText('履歴データの取得対象外')).toBeInTheDocument()
    expect(screen.getByText('値がありません（データ未受信）')).toBeInTheDocument()
    expect(fetchHistory).not.toHaveBeenCalled()
  })

  it('renders device names as text rather than HTML', () => {
    const unsafeName = '<img src=x onerror=alert(1)>'
    renderCard({ ...activeMeter, device_name: unsafeName })

    expect(screen.getByText(unsafeName)).toBeInTheDocument()
    expect(document.querySelector('img')).not.toBeInTheDocument()
  })
})
