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
}

export interface HistoryPoint {
  timestamp: string;
  temperature: number;
}

export interface HistoryResponse {
  history: HistoryPoint[];
}

export interface Status {
  meters_count: number;
  is_rate_limited: boolean;
  backoff_remaining: number;
}
