import { API_URL } from './config';
import type { HistoryPoint, MetersResponse, Status, TimeScale } from './types';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { signal });
  if (!response.ok) {
    throw new ApiError(`HTTP ${response.status}`, response.status);
  }
  return (await response.json()) as T;
}

export function fetchMeters(signal?: AbortSignal): Promise<MetersResponse> {
  return getJson<MetersResponse>('/api/meters', signal);
}

export function fetchStatus(signal?: AbortSignal): Promise<Status> {
  return getJson<Status>('/api/status', signal);
}

export function fetchHistory(
  id: string,
  scale: TimeScale,
  signal?: AbortSignal,
): Promise<{ history: HistoryPoint[] }> {
  const params = new URLSearchParams({ time_scale: scale });
  return getJson<{ history: HistoryPoint[] }>(
    `/api/meters/${encodeURIComponent(id)}/history?${params.toString()}`,
    signal,
  );
}

export function triggerRefresh(): Promise<unknown> {
  return fetch(`${API_URL}/api/meters/refresh`, { method: 'POST' }).then((response) => {
    if (!response.ok) {
      throw new ApiError(`HTTP ${response.status}`, response.status);
    }
    return response.json();
  });
}

export async function downloadBackup(): Promise<void> {
  // The backup belongs to this app's database, so it must stay same-origin.
  const response = await fetch('/api/backup');
  if (!response.ok) {
    let requestId: string | undefined;
    try {
      const data: unknown = await response.json();
      if (
        typeof data === 'object' &&
        data !== null &&
        'request_id' in data &&
        typeof data.request_id === 'string'
      ) {
        requestId = data.request_id;
      }
    } catch {
      requestId = undefined;
    }
    const message = `Failed to download backup (HTTP ${response.status}).`;
    throw new Error(requestId ? `${message} Request ID: ${requestId}` : message);
  }

  const disposition = response.headers.get('Content-Disposition') ?? '';
  const match = disposition.match(/filename="?([^";]+)"?/);
  const filename = match?.[1] ?? 'switchbot_backup.db';
  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
