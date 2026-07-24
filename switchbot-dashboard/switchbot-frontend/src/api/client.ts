import type {
  HistoryResponse,
  MetersResponse,
  StatusResponse,
  TimeScale,
} from '../types';

// Default to the snakeroom backend which actively collects readings from the
// same SwitchBot devices. Override with VITE_API_URL (e.g. '' to use the Vite
// dev proxy, or another backend origin).
const API_URL =
  import.meta.env.VITE_API_URL !== undefined
    ? import.meta.env.VITE_API_URL
    : 'https://snakeroom.fly.dev';

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export function fetchMeters(): Promise<MetersResponse> {
  return getJson<MetersResponse>('/api/meters');
}

export function fetchStatus(): Promise<StatusResponse> {
  return getJson<StatusResponse>('/api/status');
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
  const res = await fetch(`${API_URL}/api/meters/refresh`, { method: 'POST' });
  if (!res.ok) {
    throw new Error(`Refresh failed: ${res.status} ${res.statusText}`);
  }
}

export function backupUrl(): string {
  return `${API_URL}/api/backup`;
}
