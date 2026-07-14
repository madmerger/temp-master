import type {
  HistoryResponse,
  MetersResponse,
  RefreshResponse,
  StatusResponse,
  TimeScale,
} from "./types";

const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

export function apiUrl(path: string): string {
  return `${API_URL}${path}`;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), init);
  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const body = (await response.json()) as { detail?: string };
      message = body.detail ?? message;
    } catch {
      // Keep the HTTP status when the response is not JSON.
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}

export function fetchMeters(): Promise<MetersResponse> {
  return fetchJson<MetersResponse>("/api/meters");
}

export function fetchStatus(): Promise<StatusResponse> {
  return fetchJson<StatusResponse>("/api/status");
}

export function fetchHistory(deviceId: string, timeScale: TimeScale): Promise<HistoryResponse> {
  const query = new URLSearchParams({ time_scale: timeScale });
  return fetchJson<HistoryResponse>(
    `/api/meters/${encodeURIComponent(deviceId)}/history?${query.toString()}`,
  );
}

export function triggerRefresh(): Promise<RefreshResponse> {
  return fetchJson<RefreshResponse>("/api/meters/refresh", { method: "POST" });
}

export function getBackupUrl(): string {
  return apiUrl("/api/backup");
}
