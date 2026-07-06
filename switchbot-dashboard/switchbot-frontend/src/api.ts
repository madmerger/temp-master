import type { MetersResponse, HistoryResponse, StatusResponse, TimeScale } from './types';

const API_URL = window.location.protocol === 'file:' ? 'https://temp-master.fly.dev' : '';

export async function fetchMeters(): Promise<MetersResponse> {
  const res = await fetch(`${API_URL}/api/meters`);
  if (!res.ok) throw new Error(`Failed to fetch meters: ${res.statusText}`);
  return res.json() as Promise<MetersResponse>;
}

export async function fetchHistory(deviceId: string, timeScale: TimeScale): Promise<HistoryResponse> {
  const res = await fetch(`${API_URL}/api/meters/${encodeURIComponent(deviceId)}/history?time_scale=${timeScale}`);
  if (!res.ok) throw new Error(`Failed to fetch history: ${res.statusText}`);
  return res.json() as Promise<HistoryResponse>;
}

export async function fetchStatus(): Promise<StatusResponse> {
  const res = await fetch(`${API_URL}/api/status`);
  if (!res.ok) throw new Error(`Failed to fetch status: ${res.statusText}`);
  return res.json() as Promise<StatusResponse>;
}

export async function triggerRefresh(): Promise<void> {
  const res = await fetch(`${API_URL}/api/meters/refresh`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to refresh: ${res.statusText}`);
}

export function getBackupUrl(): string {
  return `${API_URL}/api/backup`;
}
