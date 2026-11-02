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
  last_updated?: string | null;
}

export interface Status {
  meters_count: number;
  is_rate_limited: boolean;
  backoff_remaining: number;
  configured?: boolean;
  last_api_call?: number;
  collection_interval?: number;
}

export interface HistoryPoint {
  timestamp: string;
  temperature: number;
}

export type TimeScale = 'hour' | 'day' | 'week' | 'month' | 'year';
