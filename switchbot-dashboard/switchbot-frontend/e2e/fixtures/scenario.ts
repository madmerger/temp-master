import type { Meter, TimeScale } from '../../src/types'

export const FIXED_NOW = '2026-11-02T09:00:00.000Z'

export const ACTIVE_DEVICE_IDS = [
  'C76B0046301A',
  'D13234351576',
  'B0E9FEB9CFA6',
  'A1B2C3D4E5F6',
]

export const STALE_DEVICE_IDS = ['F577B677EC96', '000000000000']

export const MOCK_METERS: Meter[] = [
  {
    device_id: 'C76B0046301A',
    device_name: 'Bedroom Meter',
    device_type: 'MeterPlus',
    hub_device_id: null,
    current_temperature: 20,
    current_humidity: 71,
    battery: 20,
    last_updated: '2026-11-02T08:58:00.000Z',
  },
  {
    device_id: 'D13234351576',
    device_name: 'アワコ',
    device_type: 'Meter',
    hub_device_id: null,
    current_temperature: 26.8,
    current_humidity: 68,
    battery: 100,
    last_updated: '2026-11-02T08:58:00.000Z',
  },
  {
    device_id: 'B0E9FEB9CFA6',
    device_name: 'Livingroom Hub',
    device_type: 'Hub 3',
    hub_device_id: null,
    current_temperature: 18.9,
    current_humidity: 65,
    battery: null,
    last_updated: '2026-11-02T08:58:00.000Z',
  },
  {
    device_id: 'A1B2C3D4E5F6',
    device_name: 'Garage Sensor',
    device_type: 'Meter',
    hub_device_id: null,
    current_temperature: 15.2,
    current_humidity: 55,
    battery: 80,
    last_updated: '2026-11-02T08:00:00.000Z',
  },
  {
    device_id: 'F577B677EC96',
    device_name: '夢男',
    device_type: 'Meter',
    hub_device_id: null,
    current_temperature: 24.1,
    current_humidity: 85,
    battery: 100,
    last_updated: '2026-02-09T02:13:39.000Z',
  },
  {
    device_id: '000000000000',
    device_name: 'Unknown Meter',
    device_type: 'Meter',
    hub_device_id: null,
    current_temperature: null,
    current_humidity: null,
    battery: null,
    last_updated: null,
  },
]

export const MOCK_METERS_RESPONSE = {
  meters: MOCK_METERS,
  last_updated: FIXED_NOW,
}

export const MOCK_STATUS = {
  configured: true,
  meters_count: 6,
  is_rate_limited: false,
  backoff_remaining: 0,
  last_api_call: 1793609940,
  collection_interval: 120,
}

const RANGE_MS: Record<TimeScale, number> = {
  hour: 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
  year: 365 * 24 * 60 * 60 * 1000,
}

const SCALE_OFFSET: Record<TimeScale, number> = {
  hour: 0,
  day: 0.7,
  week: 1.4,
  month: 2.1,
  year: 2.8,
}

export function createHistoryResponse(
  deviceId: string,
  timeScale: TimeScale,
) {
  const meter = MOCK_METERS.find((candidate) => candidate.device_id === deviceId)
  const baseTemperature = meter?.current_temperature ?? 0
  const now = Date.parse(FIXED_NOW)

  return {
    device_id: deviceId,
    time_scale: timeScale,
    device: meter ?? null,
    history: Array.from({ length: 12 }, (_, index) => ({
      timestamp: new Date(
        now - RANGE_MS[timeScale] +
          (RANGE_MS[timeScale] * index) / 11,
      ).toISOString(),
      temperature:
        baseTemperature +
        SCALE_OFFSET[timeScale] +
        Math.sin(index / 2) * 0.5,
      humidity: 50 + index,
      battery: meter?.battery ?? null,
    })),
  }
}
