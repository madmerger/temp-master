import type { HistoryResponse, MetersResponse, Status, TimeScale } from './types';

export const API_URL = import.meta.env.VITE_API_URL ?? 'https://snakeroom.fly.dev';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, options);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export const fetchMeters = () => request<MetersResponse>('/api/meters');
export const fetchStatus = () => request<Status>('/api/status');
export const fetchHistory = (deviceId: string, timeScale: TimeScale) =>
  request<HistoryResponse>(
    `/api/meters/${encodeURIComponent(deviceId)}/history?time_scale=${timeScale}`,
  );
export const triggerRefresh = () => request<{ status: string }>('/api/meters/refresh', { method: 'POST' });
