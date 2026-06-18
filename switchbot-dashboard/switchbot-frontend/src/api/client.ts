import type {
  MetersResponse,
  StatusResponse,
  HistoryResponse,
  TimeScale,
  LatencyLogsResponse,
  LatencyStats,
} from '../types/meter';

const API_URL = import.meta.env.VITE_API_URL || '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export function fetchMeters(): Promise<MetersResponse> {
  return request<MetersResponse>('/api/meters');
}

export function fetchStatus(): Promise<StatusResponse> {
  return request<StatusResponse>('/api/status');
}

export function fetchHistory(
  deviceId: string,
  timeScale: TimeScale,
): Promise<HistoryResponse> {
  const params = new URLSearchParams({ time_scale: timeScale });
  return request<HistoryResponse>(
    `/api/meters/${encodeURIComponent(deviceId)}/history?${params}`,
  );
}

export function triggerRefresh(): Promise<unknown> {
  return request<unknown>('/api/meters/refresh', { method: 'POST' });
}

export function downloadBackup(): void {
  window.open(`${API_URL}/api/backup`, '_blank');
}

export function fetchLatencyLogs(): Promise<LatencyLogsResponse> {
  return request<LatencyLogsResponse>('/api/latency-logs');
}

export function fetchLatencyStats(): Promise<LatencyStats> {
  return request<LatencyStats>('/api/latency-stats');
}
