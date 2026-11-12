export interface Meter {
  device_id: string
  device_name: string
  device_type: string
  hub_device_id?: string | null
  current_temperature: number | null
  current_humidity: number | null
  battery: number | null
  last_updated: string | null
}

export interface MetersResponse {
  meters: Meter[]
  last_updated: string | null
}

export interface Status {
  configured: boolean
  meters_count: number
  is_rate_limited: boolean
  backoff_remaining: number
  last_api_call: number | string | null
  collection_interval: number
}

export interface Reading {
  timestamp: string
  temperature: number
  humidity: number
  battery?: number | null
}

export interface HistoryResponse {
  device_id: string
  time_scale: TimeScale
  history: Reading[]
  device: Meter | null
}

export type TimeScale = 'hour' | 'day' | 'week' | 'month' | 'year'
