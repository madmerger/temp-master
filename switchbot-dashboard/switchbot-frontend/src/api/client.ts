import type {
  LatencyStats,
  MeterHistoryResponse,
  MetersResponse,
  StatusResponse,
  TimeScale,
} from './types';

export const API_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.PROD ? 'https://snakeroom.fly.dev' : '');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = API_URL.replace(/\/$/, '');
  const response = await fetch(`${baseUrl}${path}`, init);
  if (!response.ok) {
    let message = response.statusText || `HTTP ${response.status}`;
    try {
      const body: unknown = await response.json();
      if (body && typeof body === 'object' && 'detail' in body) {
        const detail = body.detail;
        if (typeof detail === 'string') {
          message = detail;
        }
      }
    } catch {
      message = response.statusText || `HTTP ${response.status}`;
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}

export function fetchMeters(): Promise<MetersResponse> {
  return request<MetersResponse>('/api/meters');
}

export function fetchStatus(): Promise<StatusResponse> {
  return request<StatusResponse>('/api/status');
}

export function buildLatencyStatsPath(startTime: string): string {
  const query = new URLSearchParams({ start_time: startTime });
  return `/api/latency-stats?${query.toString()}`;
}

export function fetchLatencyStats(startTime: string): Promise<LatencyStats> {
  return request<LatencyStats>(buildLatencyStatsPath(startTime));
}

export function fetchHistory(
  deviceId: string,
  timeScale: TimeScale,
): Promise<MeterHistoryResponse> {
  const encodedId = encodeURIComponent(deviceId);
  const query = new URLSearchParams({ time_scale: timeScale });
  return request<MeterHistoryResponse>(
    `/api/meters/${encodedId}/history?${query.toString()}`,
  );
}

export function triggerRefresh(): Promise<unknown> {
  return request<unknown>('/api/meters/refresh', { method: 'POST' });
}
