export interface Meter {
  device_id: string
  device_name: string
  device_type: string
  current_temperature: number | null
  current_humidity: number | null
  battery: number | null
  last_updated: string | null
}

export interface MetersResponse {
  meters: Meter[]
  last_updated: string | null
}

export interface HistoryEntry {
  timestamp: string
  temperature: number
  humidity: number
  battery: number
}

export interface HistoryResponse {
  device_id: string
  time_scale: TimeScale
  history: HistoryEntry[]
  device: Meter
}

export interface StatusResponse {
  configured: boolean
  meters_count: number
  is_rate_limited: boolean
  backoff_remaining: number
  last_api_call: string | null
  collection_interval: number
}

export type TimeScale = 'hour' | 'day' | 'week' | 'month' | 'year'
