// Base URL for the backend API. Empty string means same-origin (the FastAPI
// backend serves the built frontend). In development the Vite dev server
// proxies /api to the backend, so an empty base also works there.
export const API_URL = import.meta.env.VITE_API_URL ?? "";

export type TimeScale = "hour" | "day" | "week" | "month" | "year";

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
  last_updated?: string | null;
}

export interface StatusResponse {
  configured: boolean;
  meters_count: number;
  is_rate_limited: boolean;
  backoff_remaining: number;
  last_api_call?: number | null;
  collection_interval?: number;
}

export interface HistoryPoint {
  timestamp: string;
  temperature: number;
  humidity: number;
  battery?: number | null;
}

export interface HistoryResponse {
  device_id: string;
  time_scale: TimeScale;
  history: HistoryPoint[];
  device?: Meter | null;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export function fetchMeters(): Promise<MetersResponse> {
  return getJson<MetersResponse>("/api/meters");
}

export function fetchStatus(): Promise<StatusResponse> {
  return getJson<StatusResponse>("/api/status");
}

export function fetchHistory(
  deviceId: string,
  timeScale: TimeScale,
): Promise<HistoryResponse> {
  const qs = new URLSearchParams({ time_scale: timeScale });
  return getJson<HistoryResponse>(
    `/api/meters/${encodeURIComponent(deviceId)}/history?${qs.toString()}`,
  );
}

export async function triggerRefresh(): Promise<void> {
  const res = await fetch(`${API_URL}/api/meters/refresh`, { method: "POST" });
  if (!res.ok) {
    throw new Error(`Refresh failed: ${res.status} ${res.statusText}`);
  }
}

export function backupUrl(): string {
  return `${API_URL}/api/backup`;
}
