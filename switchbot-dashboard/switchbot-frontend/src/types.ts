export type TimeScale = 'hour' | 'day' | 'week' | 'month' | 'year';

export interface Meter {
  device_id: string;
  device_name: string;
  device_type: string;
  hub_device_id: string | null;
  current_temperature: number | null;
  current_humidity: number | null;
  battery: number | null;
  last_updated: string | null;
}

export interface DashboardStatus {
  configured: boolean;
  meters_count: number;
  is_rate_limited: boolean;
  backoff_remaining: number;
  last_api_call: string | null;
  collection_interval: number;
}

export interface HistoryPoint {
  timestamp: string;
  temperature: number;
  humidity: number | null;
  battery: number | null;
}

export interface MeterHistory {
  device_id: string;
  time_scale: TimeScale;
  history: HistoryPoint[];
  device: Meter;
}
