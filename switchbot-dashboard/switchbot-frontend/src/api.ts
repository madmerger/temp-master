import type { HistoryResponse, MetersResponse, StatusResponse, TimeScale } from './types';

export const API_BASE = (import.meta.env.VITE_API_URL ?? 'https://snakeroom.fly.dev').replace(/\/+$/, '');

export class ApiError extends Error {
  readonly status: number;

  constructor(
    message: string,
    status: number,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : String(error), 0);
  }

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const body: unknown = await response.json();
      if (body && typeof body === 'object' && 'detail' in body && typeof body.detail === 'string') {
        message = body.detail;
      }
    } catch {
      // Keep the HTTP status as the fallback message.
    }
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}

export function fetchMeters(): Promise<MetersResponse> {
  return requestJson<MetersResponse>(`${API_BASE}/api/meters`);
}

export function fetchStatus(): Promise<StatusResponse> {
  return requestJson<StatusResponse>(`${API_BASE}/api/status`);
}

export function fetchHistory(id: string, timeScale: TimeScale): Promise<HistoryResponse> {
  return requestJson<HistoryResponse>(
    `${API_BASE}/api/meters/${encodeURIComponent(id)}/history?time_scale=${encodeURIComponent(timeScale)}`,
  );
}

export function triggerRefresh(): Promise<unknown> {
  return requestJson<unknown>(`${API_BASE}/api/meters/refresh`, { method: 'POST' });
}

export function backupFilename(disposition: string | null, now = new Date()): string {
  const filenameMatch = disposition?.match(/filename="?([^";]+)"?/i);
  if (filenameMatch?.[1]) return filenameMatch[1];

  const date = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, '0'),
    String(now.getUTCDate()).padStart(2, '0'),
  ].join('');
  const time = [
    String(now.getUTCHours()).padStart(2, '0'),
    String(now.getUTCMinutes()).padStart(2, '0'),
    String(now.getUTCSeconds()).padStart(2, '0'),
  ].join('');
  return `switchbot_backup_${date}_${time}.db`;
}

export async function downloadBackup(): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api/backup`);
  } catch (error) {
    throw new ApiError(
      `Failed to download backup: ${error instanceof Error ? error.message : String(error)}`,
      0,
    );
  }

  if (!response.ok) {
    let requestId: string | undefined;
    try {
      const body: unknown = await response.json();
      if (body && typeof body === 'object' && 'request_id' in body && typeof body.request_id === 'string') {
        requestId = body.request_id;
      }
    } catch {
      // The HTTP status remains useful if the error response is not JSON.
    }
    const requestIdMessage = requestId ? ` Request ID: ${requestId}` : '';
    throw new ApiError(`Failed to download backup (HTTP ${response.status}).${requestIdMessage}`, response.status);
  }

  const filename = backupFilename(response.headers.get('Content-Disposition'));
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
