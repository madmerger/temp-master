import { API_URL } from "../config/api";

export type TimeScale = "hour" | "day" | "week" | "month" | "year";

export interface MeterDevice {
  device_id: string;
  device_name: string;
  device_type: string;
  hub_device_id: string | null;
  current_temperature: number | null;
  current_humidity: number | null;
  battery: number | null;
  last_updated: string | null;
}

export interface MetersResponse {
  meters: MeterDevice[];
  last_updated: string | null;
}

export interface MeterReading {
  timestamp: string;
  temperature: number;
  humidity: number;
  battery: number | null;
}

export interface HistoryResponse {
  device_id: string;
  time_scale: TimeScale;
  history: MeterReading[];
  device: MeterDevice | null;
}

export interface StatusResponse {
  configured: boolean;
  meters_count: number;
  is_rate_limited: boolean;
  backoff_remaining: number;
  last_api_call: number;
  collection_interval: number;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(`${API_URL}${url}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export function fetchMeters(): Promise<MetersResponse> {
  return fetchJson<MetersResponse>("/api/meters");
}

export function fetchStatus(): Promise<StatusResponse> {
  return fetchJson<StatusResponse>("/api/status");
}

export function fetchHistory(
  deviceId: string,
  timeScale: TimeScale,
): Promise<HistoryResponse> {
  return fetchJson<HistoryResponse>(
    `/api/meters/${encodeURIComponent(deviceId)}/history?time_scale=${timeScale}`,
  );
}

export async function triggerRefresh(): Promise<void> {
  const response = await fetch(`${API_URL}/api/meters/refresh`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
}
