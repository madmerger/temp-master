import type {
  HistoryResponse,
  MetersResponse,
  RefreshResponse,
  StatusResponse,
  TimeScale,
} from './types';

export const API_URL = import.meta.env.VITE_API_URL ?? 'https://snakeroom.fly.dev';
export const backupUrl = `${API_URL}/api/backup`;

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export function fetchMeters(): Promise<MetersResponse> {
  return request<MetersResponse>(`${API_URL}/api/meters`);
}

export function fetchStatus(): Promise<StatusResponse> {
  return request<StatusResponse>(`${API_URL}/api/status`);
}

export function fetchHistory(deviceId: string, timeScale: TimeScale): Promise<HistoryResponse> {
  return request<HistoryResponse>(
    `${API_URL}/api/meters/${encodeURIComponent(deviceId)}/history?time_scale=${encodeURIComponent(timeScale)}`,
  );
}

export function triggerRefresh(): Promise<RefreshResponse> {
  return request<RefreshResponse>(`${API_URL}/api/meters/refresh`, { method: 'POST' });
}
