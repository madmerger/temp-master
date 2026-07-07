import type { MetersResponse, StatusResponse, HistoryResponse } from './types';
import type { TimeScale } from './constants';

const API_URL =
  typeof window !== 'undefined' && window.location.protocol === 'file:'
    ? 'https://temp-master.fly.dev'
    : '';

export async function fetchMeters(): Promise<MetersResponse> {
  const res = await fetch(`${API_URL}/api/meters`);
  if (!res.ok) throw new Error(`Failed to fetch meters: ${res.status}`);
  return res.json() as Promise<MetersResponse>;
}

export async function fetchStatus(): Promise<StatusResponse> {
  const res = await fetch(`${API_URL}/api/status`);
  if (!res.ok) throw new Error(`Failed to fetch status: ${res.status}`);
  return res.json() as Promise<StatusResponse>;
}

export async function fetchHistory(deviceId: string, timeScale: TimeScale): Promise<HistoryResponse> {
  const res = await fetch(
    `${API_URL}/api/meters/${encodeURIComponent(deviceId)}/history?time_scale=${timeScale}`,
  );
  if (!res.ok) throw new Error(`Failed to fetch history: ${res.status}`);
  return res.json() as Promise<HistoryResponse>;
}

export async function triggerRefresh(): Promise<void> {
  const res = await fetch(`${API_URL}/api/meters/refresh`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to refresh: ${res.status}`);
}

export function getBackupUrl(): string {
  return `${API_URL}/api/backup`;
}
