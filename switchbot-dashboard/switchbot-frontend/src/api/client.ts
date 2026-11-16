import { API_URL } from '../config';
import type { Meter, Reading, Status, TimeScale } from '../types';
async function request(path: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(API_URL + path, init);
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(
      `HTTP ${response.status}${data?.detail ? ': ' + data.detail : ''}${data?.request_id ? ' Request ID: ' + data.request_id : ''}`,
    );
  }
  return response;
}
export async function fetchMeters(): Promise<{ meters: Meter[] }> {
  return (await request('/api/meters')).json();
}
export async function fetchStatus(): Promise<Status> {
  return (await request('/api/status')).json();
}
export async function fetchHistory(id: string, scale: TimeScale): Promise<{ history: Reading[] }> {
  return (
    await request(`/api/meters/${encodeURIComponent(id)}/history?time_scale=${scale}`)
  ).json();
}
export async function refreshMeters(): Promise<void> {
  await request('/api/meters/refresh', { method: 'POST' });
}
export function parseContentDisposition(value: string | null): string {
  const encoded = value?.match(/filename\*=UTF-8''([^;]+)/i);
  if (encoded) {
    try {
      return decodeURIComponent(encoded[1]);
    } catch {
      /* Fall back to plain filename. */
    }
  }
  return value?.match(/filename="?([^";]+)"?/i)?.[1] || 'switchbot_backup.db';
}
export async function downloadBackup(): Promise<void> {
  const response = await request('/api/backup');
  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = parseContentDisposition(response.headers.get('Content-Disposition'));
  document.body.appendChild(anchor);
  try {
    anchor.click();
  } finally {
    anchor.remove();
    URL.revokeObjectURL(url);
  }
}
