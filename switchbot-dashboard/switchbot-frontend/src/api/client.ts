import type {
  MetersResponse,
  HistoryResponse,
  StatusResponse,
  RefreshResponse,
  TimeScale,
} from '../types';

const API_BASE = '';

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, init);
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export function fetchMeters(): Promise<MetersResponse> {
  return fetchJson<MetersResponse>('/api/meters');
}

export function fetchStatus(): Promise<StatusResponse> {
  return fetchJson<StatusResponse>('/api/status');
}

export function fetchHistory(
  deviceId: string,
  timeScale: TimeScale,
): Promise<HistoryResponse> {
  return fetchJson<HistoryResponse>(
    `/api/meters/${encodeURIComponent(deviceId)}/history?time_scale=${timeScale}`,
  );
}

export function triggerRefresh(): Promise<RefreshResponse> {
  return fetchJson<RefreshResponse>('/api/meters/refresh', { method: 'POST' });
}

export function getBackupUrl(): string {
  return `${API_BASE}/api/backup`;
}
