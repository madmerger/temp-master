import { API_URL } from './config';
import type { DashboardStatus, Meter, MeterHistory, TimeScale } from './types';

function apiPath(path: string): string {
  return `${API_URL.replace(/\/+$/, '')}${path}`;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiPath(path), init);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`.trim());
  }
  return response.json() as Promise<T>;
}

export async function fetchMeters(): Promise<{ meters: Meter[]; last_updated: string | null }> {
  return fetchJson('/api/meters');
}

export async function fetchStatus(): Promise<DashboardStatus> {
  return fetchJson('/api/status');
}

export async function fetchHistory(
  deviceId: string,
  timeScale: TimeScale,
): Promise<MeterHistory> {
  const query = new URLSearchParams({ time_scale: timeScale });
  return fetchJson(
    `/api/meters/${encodeURIComponent(deviceId)}/history?${query.toString()}`,
  );
}

export async function triggerRefresh(): Promise<void> {
  const response = await fetch(apiPath('/api/meters/refresh'), { method: 'POST' });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`.trim());
  }
}

export async function downloadBackup(): Promise<void> {
  const response = await fetch('/api/backup');
  if (!response.ok) {
    let requestId: unknown;
    try {
      const body = (await response.json()) as { request_id?: unknown };
      requestId = body.request_id;
    } catch {
      requestId = undefined;
    }
    const message = `Failed to download backup (HTTP ${response.status}).`;
    throw new Error(
      typeof requestId === 'string' && requestId
        ? `${message} Request ID: ${requestId}`
        : message,
    );
  }

  const disposition = response.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^";]+)"?/);
  const filename = match ? match[1] : 'switchbot_backup.db';
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  try {
    anchor.click();
  } finally {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }
}
