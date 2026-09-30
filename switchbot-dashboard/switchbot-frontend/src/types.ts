export type TimeScale = 'hour' | 'day' | 'week' | 'month' | 'year'
export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export interface Meter {
  device_id: string
  device_name: string
  device_type: string
  hub_device_id: string | null
  current_temperature: number | null
  current_humidity: number | null
  battery: number | null
  last_updated: string | null
}

export interface MetersResponse {
  meters: Meter[]
  last_updated: string | null
}

export interface DashboardStatus {
  configured: boolean
  meters_count: number
  is_rate_limited: boolean
  backoff_remaining: number
  last_api_call: number
  collection_interval: number
}

export interface MeterHistoryPoint {
  timestamp: string
  temperature: number | null
  humidity: number | null
  battery: number | null
}

export interface MeterHistoryResponse {
  device_id: string
  time_scale: TimeScale
  history: MeterHistoryPoint[]
  device: Meter | null
}
