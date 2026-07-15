import type {
  DashboardStatus,
  MeterHistoryResponse,
  MetersResponse,
  RefreshResponse,
  TimeScale,
} from "../types/api";

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
export const API_BASE_URL = (
  configuredApiUrl || window.location.origin
).replace(/\/$/, "");

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;

    try {
      const body: unknown = await response.json();
      if (
        typeof body === "object" &&
        body !== null &&
        "detail" in body &&
        typeof body.detail === "string"
      ) {
        message = body.detail;
      }
    } catch {
      // Preserve the HTTP status when the response is not JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function fetchMeters(): Promise<MetersResponse> {
  return fetchJson<MetersResponse>("/api/meters");
}

export function fetchStatus(): Promise<DashboardStatus> {
  return fetchJson<DashboardStatus>("/api/status");
}

export function fetchHistory(
  deviceId: string,
  timeScale: TimeScale,
): Promise<MeterHistoryResponse> {
  const params = new URLSearchParams({ time_scale: timeScale });
  return fetchJson<MeterHistoryResponse>(
    `/api/meters/${encodeURIComponent(deviceId)}/history?${params}`,
  );
}

export function triggerRefresh(): Promise<RefreshResponse> {
  return fetchJson<RefreshResponse>("/api/meters/refresh", {
    method: "POST",
  });
}

export function getBackupUrl(): string {
  return `${API_BASE_URL}/api/backup`;
}
