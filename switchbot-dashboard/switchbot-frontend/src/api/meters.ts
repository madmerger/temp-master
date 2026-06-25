import { API_BASE_URL } from '../config/constants';
import type {
  HistoryResponse,
  MetersResponse,
  RefreshResponse,
  StatusResponse,
  TimeScale,
} from '../types';

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

async function post<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, { method: 'POST' });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export function fetchMeters(): Promise<MetersResponse> {
  return get<MetersResponse>('/api/meters');
}

export function fetchStatus(): Promise<StatusResponse> {
  return get<StatusResponse>('/api/status');
}

export function fetchHistory(
  deviceId: string,
  timeScale: TimeScale,
): Promise<HistoryResponse> {
  return get<HistoryResponse>(
    `/api/meters/${encodeURIComponent(deviceId)}/history`,
    { time_scale: timeScale },
  );
}

export function triggerRefresh(): Promise<RefreshResponse> {
  return post<RefreshResponse>('/api/meters/refresh');
}

export function fetchAllData(): Promise<[MetersResponse, StatusResponse]> {
  return Promise.all([fetchMeters(), fetchStatus()]);
}

export function getBackupUrl(): string {
  return `${API_BASE_URL}/api/backup`;
}
