export type TimeScale = 'hour' | 'day' | 'week' | 'month' | 'year';

export interface Meter {
  device_id: string;
  device_name: string;
  device_type: string;
  current_temperature: number | null;
  current_humidity: number | null;
  battery: number | null;
  last_updated: string | null;
}

export interface MetersResponse {
  meters: Meter[];
  last_updated: string | null;
}

export interface HistoryReading {
  timestamp: string;
  temperature: number;
  humidity?: number | null;
}

export interface HistoryResponse {
  device_id: string;
  time_scale: TimeScale;
  history: HistoryReading[];
  device: Meter | null;
}

export interface StatusResponse {
  configured: boolean;
  meters_count: number;
  is_rate_limited: boolean;
  backoff_remaining: number;
  last_api_call: number | null;
  collection_interval: number;
}

export interface RefreshResponse {
  status: string;
  message: string;
  meters_count: number;
}
