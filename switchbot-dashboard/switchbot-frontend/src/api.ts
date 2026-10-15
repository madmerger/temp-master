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

  const disposition = response.headers.get('Content-Disposition') ?? '';
  const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
  const filename = filenameMatch?.[1] ?? 'switchbot_backup.db';
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
