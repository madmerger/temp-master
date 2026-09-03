export type TimeScale = 'hour' | 'day' | 'week' | 'month' | 'year';

export interface Meter {
  device_id: string;
  device_name: string;
  device_type: string;
  hub_device_id?: string | null;
  current_temperature?: number | null;
  current_humidity?: number | null;
  battery?: number | null;
  last_updated?: string | null;
}

export interface MetersResponse {
  meters: Meter[];
}

export interface StatusResponse {
  configured: boolean;
  meters_count: number;
  is_rate_limited: boolean;
  backoff_remaining: number;
  last_api_call: number | null;
  collection_interval: number;
}

export interface HistoryPoint {
  timestamp: string;
  temperature: number;
  humidity: number;
  battery?: number | null;
}

export interface HistoryResponse {
  history: HistoryPoint[];
}
