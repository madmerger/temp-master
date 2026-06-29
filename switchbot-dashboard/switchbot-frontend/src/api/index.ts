import type {
  MetersResponse,
  StatusResponse,
  HistoryResponse,
  RefreshResponse,
  TimeScale,
} from "../types";

const API_BASE =
  window.location.protocol === "file:"
    ? "https://temp-master.fly.dev"
    : "";

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchMeters(): Promise<MetersResponse> {
  return fetchJSON<MetersResponse>(`${API_BASE}/api/meters`);
}

export async function fetchStatus(): Promise<StatusResponse> {
  return fetchJSON<StatusResponse>(`${API_BASE}/api/status`);
}

export async function fetchHistory(
  deviceId: string,
  timeScale: TimeScale,
): Promise<HistoryResponse> {
  const params = new URLSearchParams({ time_scale: timeScale });
  return fetchJSON<HistoryResponse>(
    `${API_BASE}/api/meters/${encodeURIComponent(deviceId)}/history?${params.toString()}`,
  );
}

export async function triggerRefresh(): Promise<RefreshResponse> {
  return fetchJSON<RefreshResponse>(`${API_BASE}/api/meters/refresh`, {
    method: "POST",
  });
}

export function getBackupUrl(): string {
  return `${API_BASE}/api/backup`;
}
