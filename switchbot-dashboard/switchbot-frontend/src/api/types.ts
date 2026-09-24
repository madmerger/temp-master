export type TimeScale = 'hour' | 'day' | 'week' | 'month' | 'year'

export const TIME_SCALES: TimeScale[] = ['hour', 'day', 'week', 'month', 'year']

export interface Meter {
  device_id: string
  device_name: string
  device_type: string
  hub_device_id?: string | null
  current_temperature?: number | null
  current_humidity?: number | null
  battery?: number | null
  last_updated?: string | null
}

export interface MetersResponse {
  meters: Meter[]
}

export interface HistoryPoint {
  timestamp: string
  temperature: number
  humidity: number
  battery?: number | null
}

export interface HistoryResponse {
  device_id: string
  time_scale: TimeScale
  history: HistoryPoint[]
}

export interface Status {
  configured: boolean
  meters_count: number
  is_rate_limited: boolean
  backoff_remaining?: number
  [key: string]: unknown
}
