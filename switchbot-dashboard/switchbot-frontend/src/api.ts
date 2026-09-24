import type { HistoryResponse, MetersResponse, StatusResponse, TimeScale } from './types';

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export function fetchMeters(): Promise<MetersResponse> {
  return getJson<MetersResponse>('/api/meters');
}

export function fetchStatus(): Promise<StatusResponse> {
  return getJson<StatusResponse>('/api/status');
}

export function fetchHistory(deviceId: string, timeScale: TimeScale): Promise<HistoryResponse> {
  return getJson<HistoryResponse>(
    `/api/meters/${encodeURIComponent(deviceId)}/history?time_scale=${timeScale}`
  );
}

export async function triggerRefresh(): Promise<void> {
  const res = await fetch(`${API_URL}/api/meters/refresh`, { method: 'POST' });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
}

export function backupUrl(): string {
  return `${API_URL}/api/backup`;
}
