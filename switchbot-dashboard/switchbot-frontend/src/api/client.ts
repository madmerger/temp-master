import type {
  MetersResponse,
  StatusResponse,
  HistoryResponse,
  TimeScale,
} from "../types";

const API_BASE = "";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, init);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchMeters(): Promise<MetersResponse> {
  return fetchJson<MetersResponse>("/api/meters");
}

export async function fetchStatus(): Promise<StatusResponse> {
  return fetchJson<StatusResponse>("/api/status");
}

export async function fetchHistory(
  deviceId: string,
  timeScale: TimeScale,
): Promise<HistoryResponse> {
  const params = new URLSearchParams({ time_scale: timeScale });
  return fetchJson<HistoryResponse>(
    `/api/meters/${encodeURIComponent(deviceId)}/history?${params}`,
  );
}

export async function triggerRefresh(): Promise<void> {
  await fetchJson<unknown>("/api/meters/refresh", { method: "POST" });
}

export function getBackupUrl(): string {
  return `${API_BASE}/api/backup`;
}
