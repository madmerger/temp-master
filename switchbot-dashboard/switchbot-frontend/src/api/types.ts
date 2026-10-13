export type TimeScale = 'hour' | 'day' | 'week' | 'month' | 'year';

export interface MeterDevice {
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
  meters: MeterDevice[];
  last_updated: string | null;
}

export interface StatusResponse {
  configured: boolean;
  meters_count: number;
  is_rate_limited: boolean;
  backoff_remaining: number;
  last_api_call: number;
  collection_interval: number;
  user_configured?: boolean;
}

export interface HistoryReading {
  timestamp: string;
  temperature: number | null;
  humidity?: number | null;
  battery?: number | null;
}

export interface MeterHistoryResponse {
  device_id: string;
  time_scale: TimeScale;
  history: HistoryReading[];
  device: MeterDevice | null;
}

export interface LatencyStats {
  total_calls: number;
  avg_latency_ms: number | null;
  min_latency_ms: number | null;
  max_latency_ms: number | null;
  successful_calls: number;
  failed_calls: number;
  success_rate: number | null;
}
