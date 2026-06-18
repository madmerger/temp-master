export interface MeterDevice {
  device_id: string;
  device_name: string;
  device_type: string;
  hub_device_id?: string;
  current_temperature?: number;
  current_humidity?: number;
  battery?: number;
  last_updated?: string;
}

export interface MeterReading {
  timestamp: string;
  temperature: number;
  humidity: number;
  battery?: number;
}

export type TimeScale = 'hour' | 'day' | 'week' | 'month' | 'year';

export interface MetersResponse {
  meters: MeterDevice[];
}

export interface HistoryResponse {
  history: MeterReading[];
}

export interface StatusResponse {
  meters_count: number;
  is_rate_limited: boolean;
  backoff_remaining?: number;
  last_refresh?: string;
}

export interface LatencyLog {
  id?: number;
  endpoint: string;
  device_id?: string;
  timestamp: string;
  latency_ms: number;
  status_code: number;
  success: boolean;
  error_message?: string;
}

export interface LatencyStats {
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  avg_latency_ms: number;
  max_latency_ms: number;
  min_latency_ms: number;
  success_rate: number;
}

export interface LatencyLogsResponse {
  logs: LatencyLog[];
  count: number;
}
