// When served from the FastAPI backend (same origin) API_BASE stays empty so
// requests go to the relative /api path. When the bundle is opened directly as a
// file:// URL, fall back to the production backend.
export const API_BASE =
  typeof window !== "undefined" && window.location.protocol === "file:"
    ? "https://temp-master.fly.dev"
    : "";

export type TimeScale = "hour" | "day" | "week" | "month" | "year";

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

export interface MetersResponse {
  meters: Meter[];
  last_updated: string | null;
}

export interface Reading {
  timestamp: string;
  temperature: number;
  humidity: number;
  battery: number | null;
}

export interface HistoryResponse {
  device_id: string;
  time_scale: TimeScale;
  history: Reading[];
  device: Meter | null;
}

export interface StatusResponse {
  configured: boolean;
  meters_count: number;
  is_rate_limited: boolean;
  backoff_remaining: number;
  last_api_call: number;
  collection_interval: number;
}

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export function fetchMeters(): Promise<MetersResponse> {
  return getJSON<MetersResponse>("/api/meters");
}

export function fetchStatus(): Promise<StatusResponse> {
  return getJSON<StatusResponse>("/api/status");
}

export function fetchHistory(
  deviceId: string,
  timeScale: TimeScale,
): Promise<HistoryResponse> {
  return getJSON<HistoryResponse>(
    `/api/meters/${encodeURIComponent(deviceId)}/history?time_scale=${timeScale}`,
  );
}

export async function triggerRefresh(): Promise<void> {
  const res = await fetch(`${API_BASE}/api/meters/refresh`, { method: "POST" });
  if (!res.ok) {
    throw new Error(`Refresh failed (${res.status})`);
  }
}

export function backupUrl(): string {
  return `${API_BASE}/api/backup`;
}
