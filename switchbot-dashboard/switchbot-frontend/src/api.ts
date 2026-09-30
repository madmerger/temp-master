import type { HistoryResponse, MetersResponse, Status, TimeScale } from './types';

export const API_URL = import.meta.env.VITE_API_URL ?? 'https://snakeroom.fly.dev';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init);
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export function fetchMeters(): Promise<MetersResponse> {
  return request<MetersResponse>('/api/meters');
}

export function fetchStatus(): Promise<Status> {
  return request<Status>('/api/status');
}

export function fetchHistory(
  deviceId: string,
  timeScale: TimeScale,
  signal?: AbortSignal,
): Promise<HistoryResponse> {
  const params = new URLSearchParams({ time_scale: timeScale });
  return request<HistoryResponse>(
    `/api/meters/${encodeURIComponent(deviceId)}/history?${params.toString()}`,
    { signal },
  );
}

export function triggerRefresh(): Promise<unknown> {
  return request<unknown>('/api/meters/refresh', { method: 'POST' });
}

export const BACKUP_URL = `${API_URL}/api/backup`;
